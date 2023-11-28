import {Express} from "express";
import Env from "../common/configs/environment_config";
import UserController from "../controllers/UserController";
class AppRoutes {

    private app: Express;
    constructor(app: Express) {
        this.app = app;
    }

    initializeRoutes() {

        const TEAM_URL = "/teams";
        // const masterRestrictionPrivilegeMiddleware = new UserPrivilegeMiddleware(this.app, []);
        // this.app.use(Env.API_PATH + TEAM_URL, masterRestrictionPrivilegeMiddleware.validatePrivileges);
        
        this.app.use(Env.API_PATH + "/", UserController);
    }
}

export default AppRoutes;