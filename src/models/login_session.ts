import { Schema, model} from "mongoose";
import { BIT } from "../common/constants/app_constants";
import { MongoId } from "../interfaces/types";

const LoginSessionSchema = new Schema<ILoginSession>({
    user: { type: Schema.Types.ObjectId, required: true, ref: 'user'},
    status: {type: Number, enum: Object.values(BIT), default: BIT.OFF},
    validity_end_date: {type: Date, default: new Date(Date.now() + 86400000)}, //1 day
    logged_out: {type: Boolean, default: false},
    expired: {type: Boolean, default: false},
    os: { type: String},
    version: { type: String},
    device: { type: String},
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface ILoginSession {
    user: MongoId,
    status: number,
    validity_end_date: Date,
    logged_out: boolean,
    expired: boolean,
    os: string,
    version: string,
    device: string,
    
    _id: MongoId
}

const LoginSession = model<ILoginSession>("login_session", LoginSessionSchema);
export default LoginSession;
