import { Types } from "mongoose";
import { BIT, PASSWORD_STATUS, USER_PASSWORD_LABEL, USER_STATUS } from "../common/constants/app_constants";
import AppValidator from "../middlewares/validators/AppValidator";
import LoginSessionService from "../services/LoginSessionService";
import PasswordService from "../services/PasswordService";
import UserService from "../services/UserService";
import SalesItemService from "../services/store/SalesItemService";
import SalesService from "../services/store/SalesService";
import BaseApiController from "./base controllers/BaseApiController";
import { SalesItemData } from "../interfaces/interfaces";



class AppController extends BaseApiController {

    userService: UserService;
    loginSessionService: LoginSessionService;
    passwordService: PasswordService;
    appValidator: AppValidator;
    salesService: SalesService;
    salesItemService: SalesItemService;

    constructor() {
        super();
    }

    protected initializeServices() {
        this.userService = new UserService();
        this.loginSessionService = new LoginSessionService();
        this.passwordService = new PasswordService();
        this.salesService = new SalesService();
        this.salesItemService = new SalesItemService();
    }
    
    protected initializeMiddleware() {
        this.appValidator = new AppValidator(this.router);
    }

    protected initializeRoutes() {
        this.me("/me"); //GET
        this.logout("/logout"); //PATCH
        this.updatePassword("/password"); //PATCH
        this.makeSales("/sales"); //POST
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
            this.appValidator.validatePasswordUpdate,
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


    makeSales(path:string) {
        this.router.post(path, this.appValidator.validateSales);
        this.router.post(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const user = this.requestService.getLoggedInUser();
                const body = req.body;

                //Fetch the products from db
                const {error, data} = await this.salesService.fetchSalesItemsProducts(body.items, session);

                if(error) {
                    const err  = new Error("There's an error with the selected products");
                    this.sendErrorResponse(res, err, this.errorResponseMessage.invalidRequest("Some products are not active or doesn't have enough quantity"), 500, session);
                }

                const salesId= new Types.ObjectId();
                const salesItemDataList: SalesItemData[] = [];
                data.forEach(item => {
                    const salesItemsData = {
                        product_id: item.product,
                        product_name: item.name,
                        sales_id: salesId.toString(),
                        quantity: item.quantity,
                        unit_cost: item.cost,
                        price: item.price,
                        discount: item.discount,
                        categories: item.categories,
                        user_id: user._id.toString()
                    }
                    salesItemDataList.push(salesItemsData);
                })

                const salesItems = await this.salesItemService.createSalesItems(salesItemDataList, session);
                const uuid = this.appUtils.generateUUIDV4();
                const salesInvoice = await this.salesService.createSales(salesItems, body.customer_name, uuid, session);

                this.sendSuccessResponse(res, {salesInvoice, salesItems}, session, 201);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session);
            }
        });
    }
    
}

export default new AppController().router;
