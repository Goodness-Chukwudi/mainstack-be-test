import DateUtils from "../../common/utils/DateUtils";
import UserValidator from "../../middlewares/validators/UserValidator";
import PasswordService from "../../services/PasswordService";
import UserPrivilegeService from "../../services/UserPrivilege.service";
import UserService from "../../services/UserService";
import BaseApiController from "../base controllers/BaseApiController";


class AdminUserController extends BaseApiController {

    userService: UserService;
    passwordService: PasswordService;
    userValidator: UserValidator;
    userPrivilegeService: UserPrivilegeService;
    dateUtils: DateUtils;

    constructor() {
        super();
    }

    protected initializeServices() {
        this.userService = new UserService();
        this.passwordService = new PasswordService();
        this.userPrivilegeService = new UserPrivilegeService();
        this.dateUtils = new DateUtils();
    }

    protected initializeMiddleware() {
        this.userValidator = new UserValidator(this.router);
    }

    protected initializeRoutes() {
        this.createNewUser("/"); //post
        this.listUsers("/"); //get
        this.assignUserPrivilege("/privileges"); //post
        this.listUserPrivileges("/privileges"); //get
    }

    createNewUser(path:string) {
        this.router.post(path, this.userValidator.validateUserOnboarding);
        this.router.post(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const loggedInUser = this.requestService.getLoggedInUser();

                const body = req.body;
                const userData = {
                    first_name: body.first_name,
                    last_name: body.last_name,
                    middle_name: body.middle_name,
                    email: body.email,
                    phone: body.phone,
                    gender: body.gender,
                    created_by: loggedInUser._id,
                }
                const user = await this.userService.save(userData, session);

                //Create a default password for the user
                //On development environment, this password defaults to "password"
                //In production the password will be randomly generated and sent to the user's email
                const password = await this.appUtils.hashData(this.appUtils.createDefaultPassword());
                const passwordData = {
                    password: password,
                    email: user.email,
                    user: user._id
                }
                await this.passwordService.save(passwordData, session);

                this.sendSuccessResponse(res, {}, session, 201);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session);
            }
        });
    }

    listUsers(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const reqQuery: Record<string, any> = req.query;
                let query:Record<string, any> = {};
    
                if (reqQuery.startDate && reqQuery.endDate) {
                    const startDate = this.dateUtils.startOfDay(reqQuery.startDate)
                    const endDate = this.dateUtils.endOfDay(reqQuery.endDate)
                    query = {...query, created_at: { $gte: startDate, $lte: endDate }}
                }
                if (reqQuery.status) query = {...query, status: reqQuery.status};
                if (reqQuery.gender) query = {...query, gender: reqQuery.gender};
    
                if (reqQuery.search) query = {...query, $or: [
                    {first_name: new RegExp(reqQuery.search, "i")},
                    {middle_name: new RegExp(reqQuery.search, "i")},
                    {last_name: new RegExp(reqQuery.search, "i")}
                ]};

                const selectedFields = ["full_name", "email", "phone", "gender", "status"]
                const users = await this.userService.paginate(query, req.query.size, req.query.page, req.query.sort, selectedFields);
                
                return this.sendSuccessResponse(res, users);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }

    assignUserPrivilege(path:string) {

        this.router.post(path, this.userValidator.validatePrivilegeAssignment);
        this.router.post(path, async (req, res) => {
            try {
                const user = this.requestService.getLoggedInUser();
                const body = req.body;

                const privilege = {
                    user: body.user,
                    role: body.role,
                    created_by: user._id
                }
                await this.userPrivilegeService.save(privilege);

                return this.sendSuccessResponse(res);

            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }
    
    listUserPrivileges(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const selectedFields = ["user", "role", "status"];
                const populatedFields = [{ path: "user", select: "first_name middle_name last_name" }];
                const userPrivileges = await this.userPrivilegeService.paginateAndPopulate({}, req.query.size, req.query.page, req.query.sort, selectedFields, populatedFields);
                
                return this.sendSuccessResponse(res, userPrivileges);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }
}

export default new AdminUserController().router;
