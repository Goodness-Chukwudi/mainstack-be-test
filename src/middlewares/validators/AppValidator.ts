import { NextFunction, Request, Response, Router } from "express";
import Joi from "joi";
import { objectId } from "../../common/utils/JoiExtensions";
import BaseRouterMiddleware from "../BaseRouterMiddleware";
import { JoiValidatorOptions } from "../../common/configs/app_config";
import { GENDER, ITEM_STATUS, USER_ROLES } from "../../common/constants/app_constants";
import UserPrivilegeService from "../../services/UserPrivilege.service";

const JoiId = Joi.extend(objectId);

class AppValidator extends BaseRouterMiddleware {

    userPrivilegeService: UserPrivilegeService;

    constructor(appRouter: Router) {
        super(appRouter);
    }

    protected initServices(): void {
        this.userPrivilegeService = new UserPrivilegeService();
    }

    validateUserOnboarding = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const BodySchema = Joi.object({
                first_name: Joi.string().max(50).required(),
                last_name: Joi.string().max(50).required(),
                middle_name: Joi.string().max(50),
                email: Joi.string().email().required(),
                phone: Joi.string().max(50).required(),
                gender: Joi.string().valid(...Object.values(GENDER)).required()
            });
            
            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            const existingUser = await this.userService.findOne({email: req.body.email});
            if(existingUser) {
                const error = new Error("A user with this email already exist");
                return this.sendErrorResponse(res, error, this.errorResponseMessage.DUPLICATE_EMAIL, 400)
            }

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };

    validatePrivilegeAssignment = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const body = req.body;
            const BodySchema = Joi.object({
                user: JoiId.string().objectId().required(),
                role: Joi.string().valid(...Object.values(USER_ROLES)).required()
            });
            
            await BodySchema.validateAsync(body, JoiValidatorOptions);

            if (body.role == USER_ROLES.SUPER_ADMIN) {
                const error = new Error("Invalid permission. You can't create a super admin user")
                return this.sendErrorResponse(res, error, this.errorResponseMessage.invalidRequest("You can't create a super admin user"), 403)
            }

            const query = {user: body.user, role: body.role, status: ITEM_STATUS.ACTIVE};
            const existingPrivilege = await this.userPrivilegeService.findOne(query);

            if (existingPrivilege) {
                const error = new Error("This user already has this privilege");
                return this.sendErrorResponse(res, error, this.errorResponseMessage.DUPLICATE_USER_ROLE, 400)
            }

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };

    validatePasswordUpdate = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const body = req.body;
            const BodySchema = Joi.object({
                password: Joi.string().required(),
                new_password: Joi.string().required(),
                confirm_password: Joi.string().required()
            });
            
            await BodySchema.validateAsync(body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };

    validateSales = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const body = req.body;
            const BodySchema = Joi.object({
                customer_name: Joi.string().max(100).required(),
                items: Joi.array().items(
                    Joi.object({
                        product: JoiId.string().objectId().required(),
                        quantity: Joi.number().integer().min(1).required()
                    })
                ).unique("product").min(1).required()
            });
            
            await BodySchema.validateAsync(body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };
}

export default AppValidator;