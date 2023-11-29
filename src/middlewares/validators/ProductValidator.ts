import { NextFunction, Request, Response, Router } from "express";
import Joi from "joi";
import { objectId } from "../../common/utils/JoiExtensions";
import BaseRouterMiddleware from "../BaseRouterMiddleware";
import { JoiValidatorOptions } from "../../common/configs/app_config";
import ProductService from "../../services/store/ProductService";

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
            if(req.body.tags) req.body.tags = JSON.parse(req.body.tags);
            if(req.body.categories) req.body.categories = JSON.parse(req.body.categories);

            const BodySchema = Joi.object({
                name: Joi.string().max(100).required(),
                price: Joi.number().min(0).required(),
                cost: Joi.number().min(0).required(),
                tags: Joi.array().items(Joi.string()).unique(),
                description: Joi.string().max(250).required(),
                categories: Joi.array().items(JoiId.string().objectId()).unique().min(1).required(),
                available_quantity: Joi.number().min(0).required()
            });
            
            await BodySchema.validateAsync(req.body, JoiValidatorOptions);

            const existingProduct = await this.productService.findOne({name: req.body.name});
            if(existingProduct) {
                const error = new Error("A product with this name already exist");
                return this.sendErrorResponse(res, error, this.errorResponseMessage.duplicateValue("Product name"), 400);
            }

            next();
        } catch (error: any) {
            return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError(error.message), 400);
        }
    };
}

export default ProductValidator;