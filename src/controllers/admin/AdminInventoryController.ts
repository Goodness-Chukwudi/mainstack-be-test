import { ITEM_STATUS, PRODUCT_URL, UPLOADED_FILE } from "../../common/constants/app_constants";
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


class AdminInventoryController extends BaseApiController {

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
                    expected_profit: (body.price * body.available_quantity) - body.cost * body.available_quantity,
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
}

export default new AdminInventoryController().router;