import { Schema, model} from "mongoose";
import { OTP_STATUS, OTP_TYPES } from "../common/constants/app_constants";

const OTPSchema = new Schema<IOTP>({
    code: {type: String, required: true},
    type: {type: String, required: true, enum: Object.values(OTP_TYPES)},
    user: { type: Schema.Types.ObjectId, required: true, ref: 'user'},
    status: { type: String, default: OTP_STATUS.ACTIVE, enum: Object.values(OTP_STATUS)}

},

{
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IOTP {
    code: string,
    type: string,
    user: any,
    status: string,

    _id: string
}

const OTP = model<IOTP>("otp", OTPSchema);
export default OTP;
