import { Schema, model} from "mongoose";
import { DISCOUNT_TYPES, ITEM_STATUS, PRODUCT_STATUS } from "../../common/constants/app_constants";
import { MongoId } from "../../interfaces/types";

const DiscountSchema = new Schema<IDiscount>({
    type: { type: String, required: true, enum: Object.values(DISCOUNT_TYPES)},
    amount: { type: Number, min: 0, required: true},
    description: { type: String},
    product: { type: Schema.Types.ObjectId, ref: "product"},
    status: { type: String, default: ITEM_STATUS.ACTIVE, enum: Object.values(ITEM_STATUS) },
    created_by: { type: Schema.Types.ObjectId, ref: "user"}
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IDiscount {
    type: string,
    amount: number,
    description: string,
    product: MongoId,
    status: string,
    created_by: MongoId,
    
    _id: MongoId
}

const Discount = model<IDiscount>("discount", DiscountSchema);
export default Discount;
