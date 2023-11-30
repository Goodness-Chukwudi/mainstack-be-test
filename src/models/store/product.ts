import { Schema, model} from "mongoose";
import { CATEGORIES, PRODUCT_STATUS } from "../../common/constants/app_constants";
import { MongoId } from "../../interfaces/types";
import mongoosePagination from "mongoose-paginate-v2";


const ProductSchema = new Schema<IProduct>({
    name: { type: String, index: true, trim: true, required: true, unique: true},
    price: { type: Number, min: 0, required: true},
    cost: { type: Number, min: 0, required: true},
    code: { type: String, index: true, required: true, immutable: true, unique: true},
    tags: { type: [String], default: []},
    description: { type: String},
    product_url: { type: String, required: true},
    images: [{ type: Schema.Types.ObjectId, ref: "product_photo"}],
    categories: {type: [String], default: [], enum: Object.values(CATEGORIES)},
    available_quantity: {type: Number, required: true, min: 0},
    is_out_of_stock: {type: Boolean, default: false},
    discount: { type: Schema.Types.ObjectId, ref: "discount"},
    is_expired: {type: Boolean, default: false},
    expiry_date: {type: Date},
    status: { type: String, default: PRODUCT_STATUS.ACTIVE, enum: Object.values(PRODUCT_STATUS) },
    created_by: { type: Schema.Types.ObjectId, ref: "user", required: true},
    updated_by: { type: Schema.Types.ObjectId, ref: "user"},
    deleted_by: { type: Schema.Types.ObjectId, ref: "user"},
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IProduct {
    name: string,
    price: number,
    cost: number,
    code: string,
    tags: string[],
    description: string,
    product_url: string,
    images: MongoId[],
    categories: string[],
    available_quantity: number,
    is_out_of_stock: boolean,
    discount: MongoId,
    is_expired: boolean,
    expiry_date: Date,
    status: string,
    created_by: MongoId,
    updated_by: MongoId,
    deleted_by: MongoId,
    
    _id: MongoId
}

ProductSchema.plugin(mongoosePagination);
const Product = model<IProduct>("product", ProductSchema);
export default Product;
