import DateUtils from "../../common/utils/DateUtils";
import UploadMiddleware from "../../middlewares/UploadMiddleware";
import ProductValidator from "../../middlewares/validators/ProductValidator";
import UserPrivilegeService from "../../services/UserPrivilege.service";
import UserService from "../../services/UserService";
import DiscountService from "../../services/store/DiscountService";
import ProductPhotosService from "../../services/store/ProductPhotosService";
import ProductService from "../../services/store/ProductService";
import SalesItemService from "../../services/store/SalesItemService";
import SalesService from "../../services/store/SalesService";
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
    salesService: SalesService;
    salesItemService: SalesItemService;

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
        this.salesItemService = new SalesItemService();
        this.salesService = new SalesService();
        this.dateUtils = new DateUtils();
    }

    protected initializeMiddleware() {
        this.productValidator = new ProductValidator(this.router);
        this.uploadMiddleware = new UploadMiddleware(this.router);
    }

    protected initializeRoutes() {
        this.addStock("/stock_entry"); //POST
        this.listStockEntry("/stock_entry"); //GET
        this.removeStock("/stock_removal"); //POST
        this.listStockRemoval("/stock_removal"); //GET
        this.listSales("/sales"); //GET
        this.listSalesItems("/sales_items"); //GET
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

                const stockEntries = await this.stockEntryService.find({product: product._id}, 1);
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

    listSales(path:string) {
        this.router.get(path, async (req, res) => {
            try {
                const reqQuery: Record<string, any> = req.query;
                let query:Record<string, any> = {};
    
                if (reqQuery.startDate && reqQuery.endDate) {
                    const startDate = this.dateUtils.startOfDay(reqQuery.startDate)
                    const endDate = this.dateUtils.endOfDay(reqQuery.endDate)
                    query = {...query, created_at: { $gte: startDate, $lte: endDate }}
                }
                if (reqQuery.customer) query = {...query, customer: new RegExp(reqQuery.customer, "i")};
                if (reqQuery.status) query = {...query, status: reqQuery.status};
                if (reqQuery.week_day_created) query = {...query, week_day_created: reqQuery.week_day_created};
                if (reqQuery.am_or_pm) query = {...query, am_or_pm: reqQuery.am_or_pm};

                if (reqQuery.startAmount && reqQuery.endAmount) query = {...query, total_amount: { $gte: reqQuery.startAmount, $lte: reqQuery.endAmount }};
                if (reqQuery.startCost && reqQuery.endCost) query = {...query, cost: { $gte: reqQuery.startCost, $lte: reqQuery.endCost }};
                if (reqQuery.startProfit && reqQuery.endProfit) query = {...query, profit: { $gte: reqQuery.startProfit, $lte: reqQuery.endProfit }};
                if (reqQuery.startDay && reqQuery.endDay) query = {...query, day_created: { $gte: reqQuery.startDay, $lte: reqQuery.endDay }};
                if (reqQuery.startWeek && reqQuery.endWeek) query = {...query, week_created: { $gte: reqQuery.startWeek, $lte: reqQuery.endWeek }};
                if (reqQuery.startMonth && reqQuery.endMonth) query = {...query, month_created: { $gte: reqQuery.startMonth, $lte: reqQuery.endMonth }};
                if (reqQuery.startYear && reqQuery.endYear) query = {...query, year_created: { $gte: reqQuery.startYear, $lte: reqQuery.endYear }};
                if (reqQuery.startHour && reqQuery.endHour) query = {...query, hour_created: { $gte: reqQuery.startHour, $lte: reqQuery.endHour }};
    
                if (reqQuery.search) query = {...query, $or: [
                    {customer: new RegExp(reqQuery.search, "i")},
                    {"items.name": new RegExp(reqQuery.search, "i")}
                ]};

                const selectedFields = ["customer", "items.name", "amount", "vat", "total_amount", "discount.total", "status", "uuid", "created_at"]
                const products = await this.salesService.paginate(query, req.query.size, req.query.page, req.query.sort, []);
                
                return this.sendSuccessResponse(res, products);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }

    listSalesItems(path:string) {
        
        this.router.get(path, async (req, res) => {
            try {
                const reqQuery: Record<string, any> = req.query;
                let query:Record<string, any> = {};
    
                if (reqQuery.startDate && reqQuery.endDate) {
                    const startDate = this.dateUtils.startOfDay(reqQuery.startDate)
                    const endDate = this.dateUtils.endOfDay(reqQuery.endDate)
                    query = {...query, created_at: { $gte: startDate, $lte: endDate }}
                }
                if (reqQuery.category) query = {...query, categories: new RegExp(reqQuery.category, "i")};
                if (reqQuery.product_name) query = {...query, product_name: new RegExp(reqQuery.product_name, "i")};
                if (reqQuery.product) query = {...query, product: reqQuery.product};
    
                if (reqQuery.search) query = {...query, $or: [
                    {product_name: new RegExp(reqQuery.search, "i")},
                    {categories: new RegExp(reqQuery.search, "i")}
                ]};

                const products = await this.salesItemService.paginate(query, req.query.size, req.query.page, req.query.sort);
                
                return this.sendSuccessResponse(res, products);
            } catch (error:any) {
                return this.sendErrorResponse(res, error, this.errorResponseMessage.UNABLE_TO_COMPLETE_REQUEST, 500)
            }
        });
    }
}

export default new AdminInventoryController().router;