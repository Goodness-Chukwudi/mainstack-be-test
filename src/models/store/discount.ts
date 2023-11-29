import { Schema, model} from "mongoose";
import { DISCOUNT_TYPES } from "../../common/constants/app_constants";
import { MongoId } from "../../interfaces/types";
import mongoosePagination from "mongoose-paginate-v2";

const DiscountSchema = new Schema<IDiscount>({
    type: { type: String, required: true, enum: Object.values(DISCOUNT_TYPES)},
    amount: { type: Number, min: 0, required: true},
    description: { type: String},
    product: { type: Schema.Types.ObjectId, ref: "product"},
    is_active: { type: Boolean, default: true },
    created_by: { type: Schema.Types.ObjectId, ref: "user", required: true}
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IDiscount {
    type: string,
    amount: number,
    description: string,
    product: MongoId,
    is_active: boolean,
    created_by: MongoId,
    
    _id: MongoId
}

DiscountSchema.plugin(mongoosePagination);
const Discount = model<IDiscount>("discount", DiscountSchema);
export default Discount;
