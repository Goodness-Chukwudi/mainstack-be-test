import {Express} from "express";
import { USER_ROLES } from "../common/constants/app_constants";
import UserPrivilegeMiddleware from "../middlewares/UserPrivilegeMiddleware";
import Env from "../common/configs/environment_config";
import AdminUserController from "../controllers/admin/AdminUserController";
import AdminProductController from "../controllers/admin/AdminProductController";


class AdminRoutes {

    private app: Express;
    constructor(app: Express) {
        this.app = app;
    }

    initializeRoutes() {
        const ADMIN_PATH = "/admin";
        const userPrivilegeMiddleware = new UserPrivilegeMiddleware(this.app, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);
        this.app.use(Env.API_PATH + ADMIN_PATH, userPrivilegeMiddleware.validatePrivileges);
        
        this.app.use(Env.API_PATH + ADMIN_PATH + "/users", AdminUserController);
        this.app.use(Env.API_PATH + ADMIN_PATH + "/products", AdminProductController);
    }
}

export default AdminRoutes;