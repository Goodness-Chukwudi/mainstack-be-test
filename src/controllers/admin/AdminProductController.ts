import Env from "../../common/configs/environment_config";
import { PRODUCT_URL, UPLOADED_FILE } from "../../common/constants/app_constants";
import DateUtils from "../../common/utils/DateUtils";
import UploadMiddleware from "../../middlewares/UploadMiddleware";
import ProductValidator from "../../middlewares/validators/ProductValidator";
import UserPrivilegeService from "../../services/UserPrivilege.service";
import UserService from "../../services/UserService";
import ProductPhotosService from "../../services/store/ProductPhotosService";
import ProductService from "../../services/store/ProductService";
import StockEntryService from "../../services/store/StockEntryService";
import BaseApiController from "../base controllers/BaseApiController";
import { Types } from "mongoose";


class AdminProductController extends BaseApiController {

    userService: UserService;
    productService: ProductService;
    productValidator: ProductValidator;
    userPrivilegeService: UserPrivilegeService;
    uploadMiddleware: UploadMiddleware;
    dateUtils: DateUtils;
    productPhotosService: ProductPhotosService;
    stockEntryService: StockEntryService;

    constructor() {
        super();
    }

    protected initializeServices() {
        this.userService = new UserService();
        this.productService = new ProductService();
        this.userPrivilegeService = new UserPrivilegeService();
        this.productPhotosService = new ProductPhotosService();
        this.stockEntryService = new StockEntryService();
        this.dateUtils = new DateUtils();
    }

    protected initializeMiddleware() {
        this.productValidator = new ProductValidator(this.router);
        this.uploadMiddleware = new UploadMiddleware(this.router);
    }

    protected initializeRoutes() {
        this.createNewProduct("/"); //post
        this.listUsers("/"); //get
    }

    createNewProduct(path:string) {
        this.router.post(path, this.productValidator.validateNewProduct);
        this.router.post(path, this.uploadMiddleware.uploadPhoto);
        this.router.post(path, async (req, res) => {
            const session = await this.appUtils.createMongooseTransaction();
            try {
                const user = this.requestService.getLoggedInUser();
                const body = req.body;
                const photoId = new Types.ObjectId();
                const productCode = await this.productService.generateProductCode(session);

                const productData = {
                    name: body.name.toLowerCase(),
                    price: body.price,
                    cost: body.cost,
                    code: productCode,
                    tags: body.tags,
                    description: body.description,
                    product_url: PRODUCT_URL + productCode,
                    images: [photoId],
                    categories: body.categories,
                    available_quantity: body.available_quantity,
                    created_by: user._id
                }
                const product = await this.productService.save(productData, session);

                const productPhoto = this.requestService.getDataFromState(UPLOADED_FILE);
                const uploadedPhoto = {
                    ...productPhoto,
                    product: product._id,
                    is_main: true,
                    _id: photoId,
                    created_by: user._id
                }
                const photo = await this.productPhotosService.save(uploadedPhoto, session);

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
                const stockEntry = await this.stockEntryService.save(stockEntryData, session)

                this.sendSuccessResponse(res, {photo, product, stockEntry}, session, 201);
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
}

export default new AdminProductController().router;