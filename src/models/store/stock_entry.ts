import { Schema, model} from "mongoose";
import { MongoId } from "../../interfaces/types";
import mongoosePagination from "mongoose-paginate-v2";

//tracks restocking of products in the store
const StockEntrySchema = new Schema<IStockEntry>({
    quantity: { type: Number, min: 0, required: true},
    total_cost: { type: Number, min: 0, required: true},
    unit_cost: { type: Number, min: 0, required: true},
    selling_price: { type: Number, min: 0, required: true},
    expected_profit: { type: Number, min: 0, required: true},
    description: { type: String},
    product: { type: Schema.Types.ObjectId, ref: "product", required: true},
    created_by: { type: Schema.Types.ObjectId, ref: "user", required: true}
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IStockEntry {
    quantity: number,
    total_cost: number,
    unit_cost: number,
    selling_price: number,
    expected_profit: number,
    description: string,
    product: MongoId,
    created_by: MongoId,
    
    _id: MongoId
}

StockEntrySchema.plugin(mongoosePagination);
const StockEntry = model<IStockEntry>("stock_entry", StockEntrySchema);
export default StockEntry;
