import { Schema, model} from "mongoose";
import { PASSWORD_STATUS } from "../common/constants/app_constants";
import { MongoId } from "../interfaces/types";

const UserPasswordSchema = new Schema<IUserPassword>({
    password: {type: String, required: true},
    email: {type: String, required: true, index: true},
    user: { type: Schema.Types.ObjectId, required: true, ref: 'user'},
    status: { type: String, default: PASSWORD_STATUS.ACTIVE, enum: Object.values(PASSWORD_STATUS)}

},

{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IUserPassword {
    password: string,
    email: string,
    user: MongoId,
    status: string,

    _id: MongoId
}

const UserPassword = model<IUserPassword>("user_password", UserPasswordSchema);
export default UserPassword;
