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
import StockRemovalService from "../../services/store/StockRemovalService";
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
    stockRemovalService: StockRemovalService;
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
        this.stockRemovalService = new StockRemovalService();
        this.discountService = new DiscountService();
        this.dateUtils = new DateUtils();
    }

    protected initializeMiddleware() {
        this.productValidator = new ProductValidator(this.router);
        this.uploadMiddleware = new UploadMiddleware(this.router);
    }

    protected initializeRoutes() {
        this.addStock("/stock_entry"); //post
        this.listStockEntry("/stock_entry"); //get
        this.removeStock("/stock_removal"); //post
        this.listStockRemoval("/stock_removal"); //get
    }

    addStock(path:string) {
        this.router.post(path, this.productValidator.validateStockEntry);
        this.router.post(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const user = this.requestService.getLoggedInUser();
                const body = req.body;

                
                const product = await this.productService.findById(body.product, undefined, session);

                if (!product) {
                    const error = new Error("A product with this Id doesn't exist");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.resourceNotFound("A product with this Id was"), 400);
                }

                const stockEntryData = {
                    quantity: body.quantity,
                    total_cost: body.unit_cost * body.quantity,
                    unit_cost: body.unit_cost,
                    selling_price: body.selling_price,
                    expected_profit: (body.selling_price * body.quantity) - (body.unit_cost * body.quantity),
                    description: body.description,
                    product: product._id,
                    created_by: user._id
                }
                await this.stockEntryService.save(stockEntryData, session);

                const update = {
                    price: body.selling_price,
                    cost: body.unit_cost,
                    available_quantity: product.available_quantity + body.quantity,
                    is_out_of_stock: false,
                }

                await this.productService.updateById(body.product, update, session)

                this.sendSuccessResponse(res, {}, session, 201);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session);
            }
        });
    }

    listStockEntry(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const reqQuery: Record<string, any> = req.query;
                let query:Record<string, any> = {};
    
                if (reqQuery.startDate && reqQuery.endDate) {
                    const startDate = this.dateUtils.startOfDay(reqQuery.startDate)
                    const endDate = this.dateUtils.endOfDay(reqQuery.endDate)
                    query = {...query, created_at: { $gte: startDate, $lte: endDate }}
                }
                if (reqQuery.product) query = {...query, product: reqQuery.product};
                if (reqQuery.created_by) query = {...query, created_by: reqQuery.created_by};

                const populatedFields = [
                    { path: "product", select: "name" },
                    {path: "created_by", select: "first_name middle_name last_name" }
                ];
                const stockEntries = await this.stockEntryService.paginateAndPopulate(query, req.query.size, req.query.page, req.query.sort, [], populatedFields);
 
                return this.sendSuccessResponse(res, stockEntries);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }

    removeStock(path:string) {
        this.router.post(path, this.productValidator.validateStockRemoval);
        this.router.post(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const user = this.requestService.getLoggedInUser();
                const body = req.body;

                
                const product = await this.productService.findById(body.product, undefined, session);

                if (!product) {
                    const error = new Error("A product with this Id doesn't exist");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.resourceNotFound("A product with this Id was"), 400);
                }

                if (product.available_quantity < body.quantity) {
                    const error = new Error("You cannot remove more that the available quantity");
                    return this.sendErrorResponse(res, error, this.errorResponseMessage.invalidRequest("You cannot remove more that the product's available quantity"), 400);
                }

                const stockEntries = await this.stockEntryService.find({product: product._id});
                const lastStockEntry = stockEntries[0];

                const stockRemovalData = {
                    quantity: body.quantity,
                    total_cost: lastStockEntry.unit_cost * body.quantity,
                    unit_cost: lastStockEntry.unit_cost,
                    selling_price: lastStockEntry.selling_price,
                    expected_loss: lastStockEntry.selling_price * body.quantity,
                    reason: body.reason,
                    product: product._id,
                    created_by: user._id
                }
                await this.stockRemovalService.save(stockRemovalData, session);

                const quantityLeft = product.available_quantity - body.quantity;
                const update = {
                    available_quantity: quantityLeft,
                    is_out_of_stock: quantityLeft > 0 ? false : true,
                }

                await this.productService.updateById(body.product, update, session)

                this.sendSuccessResponse(res, {}, session, 201);
            } catch (error: any) {
                this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500, session);
            }
        });
    }

    listStockRemoval(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const reqQuery: Record<string, any> = req.query;
                let query:Record<string, any> = {};
    
                if (reqQuery.startDate && reqQuery.endDate) {
                    const startDate = this.dateUtils.startOfDay(reqQuery.startDate)
                    const endDate = this.dateUtils.endOfDay(reqQuery.endDate)
                    query = {...query, created_at: { $gte: startDate, $lte: endDate }}
                }
                if (reqQuery.product) query = {...query, product: reqQuery.product};
                if (reqQuery.created_by) query = {...query, created_by: reqQuery.created_by};

                const populatedFields = [
                    { path: "product", select: "name" },
                    {path: "created_by", select: "first_name middle_name last_name" }
                ];
                const stockRemovals = await this.stockRemovalService.paginateAndPopulate(query, req.query.size, req.query.page, req.query.sort, [], populatedFields);
 
                return this.sendSuccessResponse(res, stockRemovals);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }
}

export default new AdminInventoryController().router;