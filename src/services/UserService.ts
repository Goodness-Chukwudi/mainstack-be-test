import DBService from './DBService';
import User, { IUser } from '../models/user';
import AppUtils from '../common/utils/AppUtils';
import { ITEM_STATUS, USER_ROLES, USER_STATUS } from '../common/constants/app_constants';
import UserPrivilegeService from './UserPrivilege.service';
import Env from '../common/configs/environment_config';
import PasswordService from './PasswordService';

class UserService extends DBService<IUser> {
    
    passwordService: PasswordService;
    appUtils: AppUtils;
    userPrivilegeService: UserPrivilegeService;

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(User, populatedFields);

        this.passwordService = new PasswordService();
        this.appUtils = new AppUtils();
        this.userPrivilegeService = new UserPrivilegeService();
    }

    /**
     * Creates a super admin user on app start up if there's no existing super admin in the database
     */
    async createSuperAdmin() {

        const session = await this.appUtils.createMongooseTransaction();

        try {
            //check if there's an existing super admin user
            const existingSuperAdmin = await this.findOne({is_super_admin: true, status: {$nin: [USER_STATUS.DEACTIVATED, USER_STATUS.DELETED]}});
            if (!existingSuperAdmin) {
                //Proceed only when there's no existing super admin user

                //Create super admin user from environment config
                const userData = {
                    first_name: Env.SUPER_ADMIN_FIRST_NAME,
                    middle_name: Env.SUPER_ADMIN_MIDDLE_NAME,
                    last_name: Env.SUPER_ADMIN_LAST_NAME,
                    email: Env.SUPER_ADMIN_EMAIL,
                    phone: Env.SUPER_ADMIN_PHONE,
                    gender: Env.SUPER_ADMIN_GENDER,
                    status: USER_STATUS.ACTIVE,
                    is_super_admin: true,
                    require_new_password: false
                }
                const user = await this.save(userData, session);

                //Create a default password for the super admin user
                //On development environment, this password defaults to "password"
                //In production the password is randomly generated and sent to the user's email
                const password = await this.appUtils.hashData(this.appUtils.createDefaultPassword());
                const passwordData = {
                    password: password,
                    email: user.email,
                    user: user._id
                }
                await this.passwordService.save(passwordData, session);

                //Deactivate any existing super admin privilege
                //There should be only one super admin at a time
                const privilegeQuery = {role: USER_ROLES.SUPER_ADMIN, status: ITEM_STATUS.ACTIVE};
                await this.userPrivilegeService.updateMany(privilegeQuery, {status: ITEM_STATUS.DEACTIVATED}, session);

                //Create new super admin
                const privilege = {
                    user: user._id,
                    role: USER_ROLES.SUPER_ADMIN,
                }
                await this.userPrivilegeService.save(privilege, session);

                console.log("New Super Admin User Created!");
                await session.commitTransaction();

            }

        } catch (error) {
            await session.abortTransaction();
            console.log("Unable to create master user!", error);
        }
    }
}

export default UserService;
