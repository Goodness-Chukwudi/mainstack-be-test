import UserPrivilege, {IUserPrivilege} from '../models/user_privilege';
import DBService from './DBService';

class UserPrivilegeService extends DBService<IUserPrivilege> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(UserPrivilege, populatedFields);
    }
    
}

export default UserPrivilegeService;
