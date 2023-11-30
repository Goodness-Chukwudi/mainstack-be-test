import { NextFunction, Request, Response, Router } from "express";
import Joi from "joi";
import { date, objectId } from "../../common/utils/JoiExtensions";
import BaseRouterMiddleware from "../BaseRouterMiddleware";
import { JoiValidatorOptions } from "../../common/configs/app_config";
import ProductService from "../../services/store/ProductService";
import { CATEGORIES, DISCOUNT_TYPES, PRODUCT_STATUS } from "../../common/constants/app_constants";

const JoiDate = Joi.extend(date);
const JoiId = Joi.extend(objectId);

class ProductValidator extends BaseRouterMiddleware {

    productService: ProductService;

    constructor(appRouter: Router) {
        super(appRouter);
    }

    protected initServices(): void {
        this.productService = new ProductService();
    }

    validateNewProduct = async ( req: Request, res: Response, next: NextFunction ) => {
        try {
            const BodySchema = Joi.object({
                name: Joi.string().max(100).required(),
                price: Joi.number().min(0).required(),
                cost: Joi.number().min(0).required(),
                tags: Joi.array().items(Joi.string()).unique(),
                description: Joi.string().max(250).required(),
                categories: Joi.array().items(Joi.string().valid(...Object.values(CATEGORIES))).unique().min(1).required(),
                available_quantity: Joi.number().integer().min(0).required()
            });
            
            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            const regex = new RegExp(`^${req.body.name}$`, "i");
            const existingProduct = await this.productService.findOne({name: regex});
            if(existingProduct) {
                const error = new Error("A product with this name already exist");
                return this.sendErrorResponse(res, error, this.errorResponseMessage.duplicateValue("Product name"), 400);
            }

            if(req.body.price < req.body.cost) {
                const error = new Error("Price is bellow cost price");
                return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError("Selling price is bellow cost price"), 400);
            }

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };

    updateProduct = async ( req: Request, res: Response, next: NextFunction ) => {

        try {
            const BodySchema = Joi.object({
                name: Joi.string().max(100),
                price: Joi.number().min(0),
                description: Joi.string().max(250),
                status: Joi.string().valid(...Object.values(PRODUCT_STATUS)),
                expiry_date: JoiDate.date().format("YYYY-MM-DD"),
                tags: Joi.array().items(Joi.string()).unique(),
                categories: Joi.array().items(Joi.string().valid(...Object.values(CATEGORIES))).unique()
            });
            
            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            const regex = new RegExp(`^${req.body.name}$`, "i");
            const existingProduct = await this.productService.findOne({name: regex});

            if(existingProduct && existingProduct._id.toString() != req.params.id) {
                const error = new Error("A product with this name already exist");
                return this.sendErrorResponse(res, error, this.errorResponseMessage.duplicateValue("Product name"), 400);
            }

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };

    validateDiscount = async ( req: Request, res: Response, next: NextFunction ) => {

        try {
            const BodySchema = Joi.object({
                type: Joi.string().valid(...Object.values(DISCOUNT_TYPES)).required(),
                amount: Joi.number().min(0).max(100).required(),
                description: Joi.string().max(250).required()
            });
            
            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };

    validateStockEntry = async ( req: Request, res: Response, next: NextFunction ) => {

        try {
            const BodySchema = Joi.object({
                quantity: Joi.number().integer().min(1).required(),
                unit_cost: Joi.number().min(0).required(),
                selling_price: Joi.number().min(0).required(),
                description: Joi.string().max(250),
                product: JoiId.string().objectId().required()
            });
            
            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };

    validateStockRemoval = async ( req: Request, res: Response, next: NextFunction ) => {

        try {
            const BodySchema = Joi.object({
                quantity: Joi.number().integer().min(1).required(),
                reason: Joi.string().max(250).required(),
                product: JoiId.string().objectId().required()
            });
            
            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };
}

export default ProductValidator;