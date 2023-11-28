import AppUtils from "../common/utils/AppUtils";
import BaseRouterMiddleware from "./BaseRouterMiddleware";
import { USER_STATUS, USER_LABEL, BIT, USER_PASSWORD_LABEL, PASSWORD_STATUS } from '../common/constants/app_constants';
import { NextFunction, Request, Response, Router } from 'express';
import UserService from "../services/UserService";
import LoginSessionService from "../services/LoginSessionService";
import PasswordService from "../services/PasswordService";
import { IUserPassword } from "../models/user_password";

class UserMiddleware extends BaseRouterMiddleware {

    private appUtils: AppUtils;
    private loginSessionService: LoginSessionService;
    private passwordService: PasswordService;

    constructor(appRouter: Router) {
        super(appRouter)
    }

    protected initServices() {
        this.appUtils = new AppUtils();
        this.userService = new UserService();
        this.loginSessionService = new LoginSessionService();
        this.passwordService = new PasswordService(["user"]);

    }

    /**
     * A middleware that fetches a user from the db using the email provided in the request.
     * - The fetched user is available through the getDataFromState or getLoggedInUser method of the request service
    */
    public loadUserToRequestByEmail = (req: Request, res: Response, next: NextFunction) => {
        const email = req.body.email;

        if (!email) {
            const error = new Error("email is required");
            return this.sendErrorResponse(res, error, this.errorResponseMessage.requiredField("Email"), 400);
        }

        this.passwordService.findOneAndPopulate({email: email, status: PASSWORD_STATUS.ACTIVE})
            .then((password) => {
                if (!password) {
                    return this.sendErrorResponse(res, new Error("User not found"), this.errorResponseMessage.INVALID_LOGIN, 400)
                }
                this.requestService.addDataToState(USER_LABEL, password.user);
                this.requestService.addDataToState(USER_PASSWORD_LABEL, password);
                next();
            })
            .catch((err) => {
                return this.sendErrorResponse( res, err, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500 );
            })
    }

    /**
     * A middleware that fetches a user from the db using the email provided in the request.
     * - The fetched user is available through the getDataFromState or getLoggedInUser method of the request service
    */
    public loadUserByResetEmail = (req: Request, res: Response, next: NextFunction) => {
        const email = req.body.email;

        if (!email) {
            const error = new Error("email is required");
            return this.sendErrorResponse(res, error, this.errorResponseMessage.requiredField("Email"), 400)
        }

        const emailRegex = new RegExp(/^([a-z0-9]+(?:[._-][a-z0-9]+)*)@([a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,})$/, "i");
        if (!emailRegex.test(email)) {
            const error = new Error("Invalid email format");
            return this.sendErrorResponse(res, error, this.errorResponseMessage.INVALID_EMAIL, 400);
        }

        this.passwordService.findOneAndPopulate({email: email})
            .then((password) => {
                if (!password) {
                    return this.sendErrorResponse(res, new Error("User not found"), this.errorResponseMessage.resourceNotFound("User"), 400)
                }
                this.requestService.addDataToState(USER_LABEL, password.user);
                this.requestService.addDataToState(USER_PASSWORD_LABEL, password);
                next();
            })
            .catch((err) => {
                return this.sendErrorResponse( res, err, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500 );
            })
    }

    /**
     * Validates the status of the user that's about to login.
     * - Returns the appropriate error response for users with invalid status
    */
    public checkUserStatus = (req: Request, res: Response, next: NextFunction) => {
        const user: any = this.requestService.getDataFromState(USER_LABEL);
        const status = user.status;

        switch(status) {
            case USER_STATUS.PENDING:
            case USER_STATUS.ACTIVE:
            case USER_STATUS.SELF_DEACTIVATED: {
               return next();
            }
            case USER_STATUS.SUSPENDED:
            case USER_STATUS.DEACTIVATED: {
               return this.sendErrorResponse( res, new Error("Account blocked"), this.errorResponseMessage.ACCOUNT_BLOCKED, 400 );
            }

            case USER_STATUS.IN_REVIEW: {
                return this.sendErrorResponse( res, new Error("Account is in review"), this.errorResponseMessage.ACCOUNT_IS_IN_REVIEW, 403 );
            }

            case USER_STATUS.HIDDEN:
            case USER_STATUS.DELETED: {
                return this.sendErrorResponse( res, new Error("Account is hidden or deleted"), this.errorResponseMessage.resourceNotFound("User"), 404 );
            }

            case undefined:
            case "":
            case null: {
                return this.sendErrorResponse(res, new Error("Invalid user status"), this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 400)
            }

            default: return this.sendErrorResponse( res, new Error("Account status is " + status), this.errorResponseMessage.CONTACT_ADMIN, 400 );
        }
    }

    /**
     * Hashes a new password.
     * - Returns an invalid login error response for invalid password
    */
    public hashNewPassword = async (req: Request, res: Response, next: any) => {
        try {
            if (req.body.new_password) {
    
                if (req.body.confirm_password != req.body.new_password) {
                    const error = new Error("Passwords do not match");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.PASSWORD_MISMATCH, 400);
                }
    
                req.body.password = await this.appUtils.hashData(req.body.new_password);
    
                next();
            } else {
                const error  =  new Error("No password provided");
                return this.sendErrorResponse(res, error, this.errorResponseMessage.requiredField("New password"), 400)
            }
            
        } catch (error:any) {
            this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
        }

    }

    /**
     * Generate a default password for a user.
    */
    public generatePassword = async (req: Request, res: Response, next: any) => {
        try {
            const password = this.appUtils.getCode(8);
            req.body.new_password = password;
            req.body.confirm_password = password;
            next();
            
        } catch (error: any) {
            this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
        }
    }

    /**
     * Validates user's password.
     * - Returns an invalid login error response for invalid password
    */
    public validatePassword = async (req: Request, res: Response, next: any) => {
        try {
            const user = this.requestService.getLoggedInUser();
            const userPassword = await this.passwordService.findOneAndPopulate({user: user._id, status: PASSWORD_STATUS.ACTIVE});

            const isCorrectPassword = await this.appUtils.validateHashedData(req.body.password, userPassword.password);
            if (!isCorrectPassword) return this.sendErrorResponse(res, new Error("Wrong password"), this.errorResponseMessage.INVALID_LOGIN, 400);

            this.requestService.addDataToState(USER_PASSWORD_LABEL, userPassword);

            next();
        } catch (error:any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_LOGIN, 400);
        }

    }

    /**
     * Logs out the user from other devices who's session hasn't expired yet.
    */
    public logoutExistingSession = async (req: Request, res: Response, next: any) => {
        const user = this.requestService.getLoggedInUser();
        try {
            const activeLoginSession = await this.loginSessionService.findOne({status: BIT.ON, user: user._id})
            if(activeLoginSession) {
                if (activeLoginSession.validity_end_date > new Date()) {
                    activeLoginSession.logged_out = true;
                    activeLoginSession.validity_end_date = new Date();
                } else {
                    activeLoginSession.expired = true
                }
                activeLoginSession.status = BIT.OFF;
                await activeLoginSession.save();
            }
            next();

        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_LOGIN, 500);
        }
    }

    public validateEmail = (req:Request, res:Response, next:any) => {
        const email = req.body.email;
        if (!email) {
            const error = new Error("Email is required");
            return this.sendErrorResponse(res, error, this.errorResponseMessage.requiredField("Email"), 400);
        }

        const emailRegex = new RegExp(/^([a-z0-9]+(?:[._-][a-z0-9]+)*)@([a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z]{2,})$/, "i");
        if (!emailRegex.test(email)) {
            const error =  new Error("Invalid email address");
            return this.sendErrorResponse(res, error, this.errorResponseMessage.INVALID_EMAIL, 400);
        }

        this.userService.findOne({email: email})
            .then((user) => {
                if (user) {
                    const error = new Error("Email already exists");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.DUPLICATE_EMAIL, 400);
                }
                next();
            })
            .catch((err) => {
                this.sendErrorResponse(res, err, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
            })
    }

    public validatePhone = (req:Request, res:Response, next:any) => {
        const phone = req.body.phone;
        if (!phone) {
            const error = new Error("Phone number is required");
            return this.sendErrorResponse(res, error, this.errorResponseMessage.requiredField("Phone"), 400);
        }

        this.userService.findOne({phone: phone})
            .then((user) => {
                if (user) {
                    const error = new Error("Phone number already exists");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.DUPLICATE_PHONE, 400);
                }
                next();
            })
            .catch((err) => {
                this.sendErrorResponse(res, err, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
            })
    }
}

export default UserMiddleware;
