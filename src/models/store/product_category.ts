import { Schema, model} from "mongoose";
import { ITEM_STATUS } from "../../common/constants/app_constants";
import { MongoId } from "../../interfaces/types";

const ProductCategorySchema = new Schema<IProductCategory>({
    name: { type: String, required: true, unique: true},
    description: { type: String},
    status: { type: String, default: ITEM_STATUS.ACTIVE, enum: Object.values(ITEM_STATUS) },
    created_by: { type: Schema.Types.ObjectId, ref: "user"}
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IProductCategory {
    name: string,
    description: string,
    status: string,
    created_by: MongoId,
    
    _id: MongoId
}

const ProductCategory = model<IProductCategory>("product_category", ProductCategorySchema);
export default ProductCategory;
