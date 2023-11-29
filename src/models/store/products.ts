import { Schema, model} from "mongoose";
import { PRODUCT_STATUS } from "../../common/constants/app_constants";
import { MongoId } from "../../interfaces/types";

const ProductSchema = new Schema<IProduct>({
    name: { type: String, index: true, trim: true, required: true, unique: true},
    price: { type: Number, min: 0, required: true},
    code: { type: String, index: true, required: true, immutable: true},
    tags: { type: [String]},
    description: { type: String},
    discounts: [{ type: Schema.Types.ObjectId, ref: "discount"}], //max of 5 active discounts
    images: [{ type: Schema.Types.ObjectId, ref: "product_photo"}], //max of 5 active photos
    categories: [{ type: Schema.Types.ObjectId, ref: "product_category"}], // max of 10 active categories
    available_quantity: {type: Number, default: 0, min: 0},
    is_out_of_stock: {type: Boolean, default: false},
    is_expired: {type: Boolean, default: false},
    expiry_date: {type: Date},
    status: { type: String, default: PRODUCT_STATUS.ACTIVE, enum: Object.values(PRODUCT_STATUS) },
    created_by: { type: Schema.Types.ObjectId, ref: "user"},
    updated_by: { type: Schema.Types.ObjectId, ref: "user"},
    deleted_by: { type: Schema.Types.ObjectId, ref: "user"},
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IProduct {
    name: string,
    price: number,
    code: string,
    tags: string[],
    description: string,
    discounts: MongoId[],
    images: MongoId[],
    categories: MongoId[],
    available_quantity: number,
    is_out_of_stock: boolean,
    is_expired: boolean,
    expiry_date: Date,
    status: string,
    created_by: MongoId,
    updated_by: MongoId,
    deleted_by: MongoId,
    
    _id: MongoId
}

const Product = model<IProduct>("product", ProductSchema);
export default Product;
