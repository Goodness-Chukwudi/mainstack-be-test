import BaseApiController from "./base controllers/BaseApiController";
import LoginSessionService from "../services/LoginSessionService";
import { BIT, PASSWORD_STATUS, USER_PASSWORD_LABEL, USER_STATUS } from "../common/constants/app_constants";
import PasswordService from "../services/PasswordService";

class AuthController extends BaseApiController {

    private loginSessionService: LoginSessionService;
    private passwordService: PasswordService;

    constructor() {
        super();
    }
    
    protected initializeServices() {
        this.loginSessionService = new LoginSessionService();
        this.passwordService = new PasswordService();
    }

    protected initializeMiddleware() {

    }

    protected initializeRoutes() {
        this.login("/login"); //POST
        this.resetPassword("/password"); //POST
    }

    login(path:string) {
        this.router.post(path,
            this.userMiddleWare.loadUserToRequestByEmail,
            this.userMiddleWare.checkUserStatus,
            this.userMiddleWare.validatePassword,
            this.userMiddleWare.logoutExistingSession
        );

        this.router.post(path, async (req, res) => {
            const user = this.requestService.getLoggedInUser();

            try {
                const loginSessionData = {
                    user: user._id,
                    status: BIT.ON
                };
        
                const loginSession = await this.loginSessionService.save(loginSessionData);
                const token = this.appUtils.createAuthToken(user._id, loginSession._id);


                const response = {
                    message: this.successResponseMessage.LOGIN_SUCCESSFUL,
                    token: token
                }
                
                if (user.status == USER_STATUS.SELF_DEACTIVATED) {
                    response.message = this.successResponseMessage.ACCOUNT_ACTIVATION_REQUIRED;
                }
                if (user.status == USER_STATUS.PENDING || user.require_new_password) {
                    response.message = this.successResponseMessage.PASSWORD_UPDATE_REQUIRED;
                }

                return res.status(200).json(response);
            } catch (error:any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_LOGIN, 500);
            }
        });
    }

    resetPassword(path:string) {
        this.router.post(path,
            this.userMiddleWare.loadUserByResetEmail,
            this.userMiddleWare.generatePassword,
            this.userMiddleWare.hashNewPassword
        );

        this.router.post(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const loggedInUser = this.requestService.getLoggedInUser();
                const previousPassword = this.requestService.getDataFromState(USER_PASSWORD_LABEL);

                const password = await this.appUtils.hashData(this.appUtils.createDefaultPassword());
                const passwordData = {
                    password: password,
                    email: loggedInUser.email,
                    user: loggedInUser._id
                }
                await this.passwordService.save(passwordData, session);
                //Deactivate old password
                await this.passwordService.updateById(previousPassword._id, {status: PASSWORD_STATUS.DEACTIVATED});

                await this.userService.updateById(loggedInUser._id, {require_new_password: true}, session);
                //Send email to user email here
                //For the purpose of this test password is always "password"

                this.sendSuccessResponse(res, {}, session);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session);
            }
        });
    }
}

export default new AuthController().router;
