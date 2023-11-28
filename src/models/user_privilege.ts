import { Schema, model} from "mongoose";
import { ITEM_STATUS, USER_ROLES } from "../common/constants/app_constants";
import mongoosePagination from "mongoose-paginate-v2";
import { MongoId } from "../interfaces/types";

const UserPrivilegeSchema = new Schema<IUserPrivilege>({
    user: { type: Schema.Types.ObjectId, ref: "user"},
    role: { type: String, required: true, enum: Object.values(USER_ROLES) },
    created_by: { type: Schema.Types.ObjectId, ref: "user"},
    updated_by: { type: Schema.Types.ObjectId, ref: "user" },
    status: { type: String, default: ITEM_STATUS.ACTIVE, enum: Object.values(ITEM_STATUS) }
}, 
{
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IUserPrivilege {
    user: MongoId,
    role: string,
    status: string,
    created_by: MongoId,
    updated_by: MongoId,
    
    _id: MongoId
}

UserPrivilegeSchema.plugin(mongoosePagination);
const UserPrivilege = model<IUserPrivilege>("user_privilege", UserPrivilegeSchema);
export default UserPrivilege;
