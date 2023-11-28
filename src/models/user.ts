import { Schema, model} from "mongoose";
import { GENDER, USER_STATUS } from "../common/constants/app_constants";
import mongoosePagination from "mongoose-paginate-v2";
import { MongoId } from "../interfaces/types";

const UserSchema = new Schema<IUser>({
        first_name: { type: String,  required: [true, "first name is required"], trim: true, index: true},
        last_name: { type: String,  required: [true, "last name is required"], trim: true, index: true},
        middle_name: { type: String},
        email: { type: String, lowercase: true, unique: true, trim: true, required: [true, "email is required"]},
        phone: { type: String, unique: true, required: [true, "phone is required"], trim: true},
        phone_country_code: { type: String,  default: "234"},
        gender: {type: String, lowercase: true, required: [true, "gender is required"], enum: Object.values(GENDER)},
        status: { type: String, default: USER_STATUS.PENDING, enum: Object.values(USER_STATUS) },
        is_super_admin: {type: Boolean, default: false},
        is_admin: {type: Boolean, default: false},
        require_new_password: {type: Boolean, default: true},
        created_by: { type: Schema.Types.ObjectId, ref: "user"},
        updated_by: { type: Schema.Types.ObjectId, ref: "user"},
        deleted_by: { type: Schema.Types.ObjectId, ref: "user"}
    },
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
        timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
    })
;

UserSchema.virtual('full_name').get(function() {
    if (this.middle_name)
    return `${this.first_name} ${this.middle_name} ${this.last_name}`;
    return `${this.first_name} ${this.last_name}`;
});

UserSchema.virtual('phone_with_country_code').get(function() {
    if (this.phone && this.phone_country_code) {
        const phoneWithoutZero = parseInt(this.phone);
        const phone = '+' + this.phone_country_code + phoneWithoutZero.toString();
        return phone;
    }
});


export interface IUser {

    first_name: string,
    last_name: string,
    middle_name: string,
    full_name: string,
    phone_with_country_code: string,
    email: string,
    phone: string,
    phone_country_code: string,
    gender: string,
    status: string,
    is_super_admin: boolean,
    is_admin: boolean,
    require_new_password: boolean,
    created_by: MongoId,
    updated_by: MongoId,
    deleted_by: MongoId,
    
    _id: MongoId
}

UserSchema.plugin(mongoosePagination);
const User = model<IUser>("user", UserSchema);
export default User;
