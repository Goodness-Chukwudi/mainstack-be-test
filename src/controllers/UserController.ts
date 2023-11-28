import { BIT, PASSWORD_STATUS, USER_PASSWORD_LABEL, USER_STATUS } from "../common/constants/app_constants";
import UserValidator from "../middlewares/validators/UserValidator";
import LoginSessionService from "../services/LoginSessionService";
import PasswordService from "../services/PasswordService";
import UserService from "../services/UserService";
import BaseApiController from "./base controllers/BaseApiController";



class UserController extends BaseApiController {

    userService: UserService;
    loginSessionService: LoginSessionService;
    passwordService: PasswordService;
    userValidator: UserValidator;

    constructor() {
        super();
    }

    protected initializeServices() {
        this.userService = new UserService();
        this.loginSessionService = new LoginSessionService();
        this.passwordService = new PasswordService();
    }
    
    protected initializeMiddleware() {
        this.userValidator = new UserValidator(this.router);
    }

    protected initializeRoutes() {
        this.me("/me"); //get
        this.logout("/logout"); //patch
        this.updatePassword("/password"); //patch
    }

    me(path:string) {
        //returns the logged in user
        this.router.get(path, (req, res) => {
            const user = this.requestService.getLoggedInUser();
            this.sendSuccessResponse(res, user);
        })
    }


    logout(path:string) {
        this.router.patch(path, async (req, res) => {
            try {
                const activeLoginSession = this.requestService.getLoginSession();
    
                if (activeLoginSession.validity_end_date > new Date()) {
                    activeLoginSession.logged_out = true;
                    activeLoginSession.validity_end_date = new Date();
                } else {
                    activeLoginSession.expired = true
                }
                activeLoginSession.status = BIT.OFF;
                await activeLoginSession.save();
                this.sendSuccessResponse(res);
    
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }


    updatePassword(path:string) {
        this.router.patch(path,
            this.userValidator.validatePasswordUpdate,
            this.userMiddleWare.validatePassword,
            this.userMiddleWare.hashNewPassword
        );

        this.router.patch(path, async (req, res, next) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const loggedInUser = this.requestService.getLoggedInUser();
                const previousPassword = this.requestService.getDataFromState(USER_PASSWORD_LABEL);

                const passwordData = {
                    password: req.body.password,
                    email: loggedInUser.email,
                    user: loggedInUser._id
                }
                await this.passwordService.save(passwordData, session);
                //Deactivate old password
                await this.passwordService.updateById(previousPassword._id, {status: PASSWORD_STATUS.DEACTIVATED});

                const update = {require_new_password: false, status: USER_STATUS.ACTIVE};
                const user = await this.userService.updateById(loggedInUser._id, update, session);
                //Send email to user email here
                //For the purpose of this test password is always "password"

                this.requestService.addDataToState("updated_user", user);
                await session.commitTransaction();
                next();
            } catch (error:any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session) 
            }
        });

        this.router.patch(path, this.userMiddleWare.logoutExistingSession);
        this.router.patch(path, async (req, res) => {
            try {
                const user = this.requestService.getDataFromState("updated_user");
    
                const loginSessionData = {
                    user: user._id,
                    status: BIT.ON
                };
                const loginSession = await this.loginSessionService.save(loginSessionData);
                const token = this.appUtils.createAuthToken(user._id, loginSession._id);
        
                this.sendSuccessResponse(res, {message: this.successResponseMessage.PASSWORD_UPDATE_SUCCESSFUL, token: token});                
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }
    
}

export default new UserController().router;
