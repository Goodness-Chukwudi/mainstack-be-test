import { PRODUCT_URL, UPLOADED_FILE } from "../../common/constants/app_constants";
import DateUtils from "../../common/utils/DateUtils";
import UploadMiddleware from "../../middlewares/UploadMiddleware";
import ProductValidator from "../../middlewares/validators/ProductValidator";
import UserPrivilegeService from "../../services/UserPrivilege.service";
import UserService from "../../services/UserService";
import DiscountService from "../../services/store/DiscountService";
import ProductPhotosService from "../../services/store/ProductPhotosService";
import ProductService from "../../services/store/ProductService";
import StockEntryService from "../../services/store/StockEntryService";
import BaseApiController from "../base controllers/BaseApiController";


class AdminProductController extends BaseApiController {

    userService: UserService;
    productService: ProductService;
    productValidator: ProductValidator;
    userPrivilegeService: UserPrivilegeService;
    uploadMiddleware: UploadMiddleware;
    dateUtils: DateUtils;
    productPhotosService: ProductPhotosService;
    stockEntryService: StockEntryService;
    discountService: DiscountService;

    constructor() {
        super();
    }

    protected initializeServices() {
        this.userService = new UserService();
        this.productService = new ProductService();
        this.userPrivilegeService = new UserPrivilegeService();
        this.productPhotosService = new ProductPhotosService();
        this.stockEntryService = new StockEntryService();
        this.discountService = new DiscountService();
        this.dateUtils = new DateUtils();
    }

    protected initializeMiddleware() {
        this.productValidator = new ProductValidator(this.router);
        this.uploadMiddleware = new UploadMiddleware(this.router);
    }

    protected initializeRoutes() {
        this.createNewProduct("/"); //post
        this.listProducts("/"); //get
        this.getProductDetails("/:id/details"); //get
        this.updateProduct("/:id"); //patch
        this.uploadProductPhoto("/:id/photo"); //patch
        this.createDiscount("/:id/discounts"); //post
        this.toggleDiscountStatus("/discounts/:id/status"); //patch
        this.listDiscounts("/discounts"); //get
    }

    createNewProduct(path:string) {
        this.router.post(path, this.productValidator.validateNewProduct);
        this.router.post(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const user = this.requestService.getLoggedInUser();
                const body = req.body;
                const productCode = await this.productService.generateProductCode(session);

                const productData = {
                    name: body.name,
                    price: body.price,
                    cost: body.cost,
                    code: productCode,
                    tags: body.tags,
                    description: body.description,
                    product_url: PRODUCT_URL + productCode,
                    categories: body.categories,
                    available_quantity: body.available_quantity,
                    created_by: user._id
                }
                const product = await this.productService.save(productData, session);

                const stockEntryData = {
                    quantity: body.available_quantity,
                    total_cost: body.cost * body.available_quantity,
                    unit_cost: body.cost,
                    selling_price: body.price,
                    expected_profit: (body.price * body.available_quantity) - (body.cost * body.available_quantity),
                    description: "Initial stock entry",
                    product: product._id,
                    created_by: user._id
                }
                await this.stockEntryService.save(stockEntryData, session)

                this.sendSuccessResponse(res, {}, session, 201);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session);
            }
        });
    }

    uploadProductPhoto(path:string) {
        this.router.patch(path, this.productValidator.validateDefaultParams);
        this.router.patch(path, this.uploadMiddleware.uploadPhoto);
        this.router.patch(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const id = req.params.id;
                const user = this.requestService.getLoggedInUser();
                const body = req.body;
                const product = await this.productService.findById(id, undefined, session);
                if (!product) {
                    const error = new Error("A product with this Id doesn't exist");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.resourceNotFound("A product with this Id was"), 400, session);
                }

                const isMain = this.appUtils.convertToBoolean(body.is_main) || product.images.length == 0;
                if (isMain) this.productPhotosService.updateOne({product: id, is_main: true}, {is_main: false}, session);

                const productPhoto = this.requestService.getDataFromState(UPLOADED_FILE);
                const uploadedPhoto = {
                    ...productPhoto,
                    product: product._id,
                    is_main: isMain,
                    created_by: user._id
                }
                const photo = await this.productPhotosService.save(uploadedPhoto, session);
                product.images.push(photo._id);
                await product.save({session: session});

                this.sendSuccessResponse(res, {}, session, 201);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session);
            }
        });
    }

    createDiscount(path:string) {
        this.router.post(path, this.productValidator.validateDefaultParams);
        this.router.post(path, this.productValidator.validateDiscount);
        this.router.post(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const id = req.params.id;
                const user = this.requestService.getLoggedInUser();
                const body = req.body;
                const product = await this.productService.findById(id, undefined, session);
                if (!product) {
                    const error = new Error("A product with this Id doesn't exist");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.resourceNotFound("A product with this Id was"), 400, session);
                }

                await this.discountService.updateOne({product: product._id, is_active: true}, {is_active: false}, session);

                const discountData = {
                    type: body.type,
                    amount: body.amount,
                    description: body.description,
                    product: id,
                    created_by: user._id
                }
                await this.discountService.save(discountData, session);

                this.sendSuccessResponse(res, {}, session, 201);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session);
            }
        });
    }

    toggleDiscountStatus(path:string) {
        this.router.patch(path, this.productValidator.validateDefaultParams);
        this.router.patch(path, async (req, res) => {
            try {
                const id = req.params.id;
                const discount = await this.discountService.findById(id);
                if (!discount) {
                    const error = new Error("A product discount with this Id doesn't exist");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.resourceNotFound("A product discount with this Id was"), 400);
                }

                discount.is_active = !discount.is_active;
                await discount.save();

                this.sendSuccessResponse(res);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500);
            }
        });
    }

    listDiscounts(path:string) {
        this.router.get(path, async (req, res) => {

            try {
                const reqQuery: Record<string, any> = req.query;
                let query:Record<string, any> = {};
    
                if (reqQuery.startDate && reqQuery.endDate) {
                    const startDate = this.dateUtils.startOfDay(reqQuery.startDate)
                    const endDate = this.dateUtils.endOfDay(reqQuery.endDate)
                    query = {...query, created_at: { $gte: startDate, $lte: endDate }}
                }
                if (reqQuery.startAmount && reqQuery.endAmount) {
                    query = {...query, amount: { $gte: reqQuery.startAmount, $lte: reqQuery.endAmount }}
                }
                if (reqQuery.type) query = {...query, type: reqQuery.type};
                if (reqQuery.product) query = {...query, product: reqQuery.product};
                if (reqQuery.is_active) query = {...query, is_active: reqQuery.is_active};

                const selectedFields = ["type", "amount", "description", "product", "is_active"];
                const populatedFields = [{ path: "product", select: "name" }];

                const discounts = await this.discountService.paginateAndPopulate(query, req.query.size, req.query.page, req.query.sort, selectedFields, populatedFields);
                
                return this.sendSuccessResponse(res, discounts);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }

    listProducts(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const reqQuery: Record<string, any> = req.query;
                let query:Record<string, any> = {};
    
                if (reqQuery.startDate && reqQuery.endDate) {
                    const startDate = this.dateUtils.startOfDay(reqQuery.startDate)
                    const endDate = this.dateUtils.endOfDay(reqQuery.endDate)
                    query = {...query, created_at: { $gte: startDate, $lte: endDate }}
                }
                if (reqQuery.startPrice && reqQuery.endPrice) {
                    query = {...query, price: { $gte: reqQuery.startPrice, $lte: reqQuery.endPrice }}
                }
                if (reqQuery.startCost && reqQuery.endCost) {
                    query = {...query, cost: { $gte: reqQuery.startCost, $lte: reqQuery.endCost }}
                }
                if (reqQuery.startQuantity && reqQuery.endQuantity) {
                    query = {...query, available_quantity: { $gte: reqQuery.startQuantity, $lte: reqQuery.endQuantity }}
                }
                if (reqQuery.code) query = {...query, code: reqQuery.code};
                if (reqQuery.status) query = {...query, status: reqQuery.status};
                if (reqQuery.categories) query = {...query, categories: {$in: reqQuery.categories}};
    
                if (reqQuery.search) query = {...query, $or: [
                    {name: new RegExp(reqQuery.search, "i")},
                    {middle_name: new RegExp(reqQuery.search, "i")},
                    {last_name: new RegExp(reqQuery.search, "i")}
                ]};

                const selectedFields = ["name", "price", "cost", "code", "available_quantity", "categories"]
                const products = await this.productService.paginate(query, req.query.size, req.query.page, req.query.sort, selectedFields);
                
                return this.sendSuccessResponse(res, products);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }

    getProductDetails(path:string) {
        this.router.get(path, this.productValidator.validateDefaultParams);
        this.router.get(path, async (req, res) => {
            try {

                const id = req.params.id;
                const populatedFields = [
                    { path: "images", select: "url thumbnail_url is_main status" },
                    {path: "created_by", select: "first_name middle_name last_name" }
                ];

                const product = await this.productService.findByIdAndPopulate(id, undefined, populatedFields);

                if (!product) {
                    const error = new Error("A product with this Id doesn't exist");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.resourceNotFound("A product with this Id was"), 404);
                }
                
                return this.sendSuccessResponse(res, product);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }

    updateProduct(path:string) {
        this.router.patch(path, this.productValidator.validateDefaultParams);
        this.router.patch(path, this.productValidator.updateProduct);
        this.router.patch(path, async (req, res) => {
            try {
                const id = req.params.id;

                const product = await this.productService.findById(id);
                if (!product) {
                    const error = new Error("A product with this Id doesn't exist");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.resourceNotFound("A product with this Id was"), 404);
                }

                if(req.body.price < product.cost) {
                    const error = new Error("Price is bellow cost price");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.badRequestError("Selling price is bellow cost price"), 400);
                }

                let update = {};
                if (req.body.name) update = {...update, name: req.body.name};
                if (req.body.price) update = {...update, price: req.body.price};
                if (req.body.description) update = {...update, description: req.body.description};
                if (req.body.status) update = {...update, status: req.body.status};
                if (req.body.expiry_date) update = {...update, expiry_date: req.body.expiry_date};
                if (req.body.tags) {
                    const newTags: string[] = req.body.tags;
                    newTags.forEach(tag => {
                        if (!product.tags.includes(tag)) product.tags.push(tag);
                    })
                    update = {...update, tags: product.tags};
                }
                if (req.body.categories) {
                    const newCategories: string[] = req.body.categories;
                    newCategories.forEach(category => {
                        if (!product.categories.includes(category)) product.categories.push(category);
                    })
                    update = {...update, categories: product.categories};
                }

                await this.productService.updateById(id, update);
                
                return this.sendSuccessResponse(res);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }
}

export default new AdminProductController().router;