import { Schema, model} from "mongoose";
import { ITEM_STATUS } from "../../common/constants/app_constants";
import { MongoId } from "../../interfaces/types";

//tracks restocking of products in the store
const StockEntrySchema = new Schema<IStockEntry>({
    quantity: { type: Number, min: 0, required: true},
    total_cost: { type: Number, min: 0, required: true},
    unit_cost: { type: Number, min: 0, required: true},
    selling_price: { type: Number, min: 0, required: true},
    expected_profit: { type: Number, min: 0, required: true},
    description: { type: String},
    product: { type: Schema.Types.ObjectId, ref: "product"},
    created_by: { type: Schema.Types.ObjectId, ref: "user"}
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

const StockEntry = model<IStockEntry>("stock_entry", StockEntrySchema);
export default StockEntry;
