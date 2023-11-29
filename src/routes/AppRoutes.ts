import {Express} from "express";
import Env from "../common/configs/environment_config";
import UserController from "../controllers/UserController";
class AppRoutes {

    private app: Express;
    constructor(app: Express) {
        this.app = app;
    }

    initializeRoutes() {
        
        this.app.use(Env.API_PATH + "/", UserController);
    }
}

export default AppRoutes;