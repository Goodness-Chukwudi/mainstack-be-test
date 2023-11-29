import { Model, Schema, model} from "mongoose";
import { MongoId } from "../../interfaces/types";
import { ItemDiscountSchema } from "./sales_items";

const SalesDiscountSchema = new Schema({
    discounts: {type: [ItemDiscountSchema], required: true},
    total: {type: Number, min: 0, required: true}
})

const ItemSchema = new Schema({
    sales_item: {type: Schema.Types.ObjectId, ref: "sales_item", required: true},
    name: {type: String, required: true}
})

const SalesInvoiceSchema = new Schema<ISalesInvoice>({
    customer: { type: String, required: true, trim: true, index: true},
    items: {type: [ItemSchema], required: true},
    amount: { type: Number, min: 0, required: true},
    vat: { type: Number, min: 0, default: 0},
    total_amount: { type: Number, min: 0, required: true},
    discount: {type: SalesDiscountSchema},
    profit: { type: Number, min: 0, required: true},
    created_by: { type: Schema.Types.ObjectId, ref: "user"}
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface ISalesInvoice {
    customer: string,
    items: typeof ItemSchema[],
    amount: number,
    vat: number,
    total_amount: number,
    discount: typeof SalesDiscountSchema,
    profit: number,
    created_by: MongoId
    
    _id: MongoId
}

const SalesInvoice = model<ISalesInvoice>("sales_invoice", SalesInvoiceSchema);
export default SalesInvoice;
