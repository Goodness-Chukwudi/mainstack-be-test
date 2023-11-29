import { Schema, model} from "mongoose";
import { MongoId } from "../../interfaces/types";

export const ItemDiscountSchema = new Schema({
    discount: {type: Schema.Types.ObjectId, ref: "discount", required: true},
    amount: {type: Number, min: 0, required: true}
})

const SalesItemSchema = new Schema<ISalesItem>({
    product: { type: Schema.Types.ObjectId, ref: "product"},
    sales_invoice: { type: Schema.Types.ObjectId, ref: "sales", required: true},
    quantity: { type: Number, min: 0, required: true},
    unit_cost: { type: Number, min: 0, required: true},
    total_cost: { type: Number, min: 0, required: true},
    unit_price: { type: Number, min: 0, required: true},
    total_price: { type: Number, min: 0, required: true},
    profit: { type: Number, min: 0, required: true},
    discount: {type: ItemDiscountSchema},
    code: { type: String, index: true, required: true, immutable: true, unique: true},
    created_by: { type: Schema.Types.ObjectId, ref: "user"}
},
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface ISalesItem {
    product: MongoId,
    sales_invoice: MongoId,
    quantity: number,
    unit_cost: number,
    total_cost: number,
    unit_price: number,
    total_price: number,
    profit: number,
    discount: typeof ItemDiscountSchema,
    code: string,
    created_by: MongoId
    
    _id: MongoId
}

const SalesItem = model<ISalesItem>("sales_item", SalesItemSchema);
export default SalesItem;
