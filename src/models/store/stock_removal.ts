import { Schema, model} from "mongoose";
import { ITEM_STATUS } from "../../common/constants/app_constants";
import { MongoId } from "../../interfaces/types";

//tracks removing of products from the store
const StockRemovalSchema = new Schema<IStockRemoval>({
    quantity: { type: Number, min: 0, required: true},
    total_cost: { type: Number, min: 0, required: true},
    unit_cost: { type: Number, min: 0, required: true},
    selling_price: { type: Number, min: 0, required: true},
    expected_loss: { type: Number, min: 0, required: true},
    reason: { type: String},
    product: { type: Schema.Types.ObjectId, ref: "product"},
    created_by: { type: Schema.Types.ObjectId, ref: "user", required: true}
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IStockRemoval {
    quantity: number,
    total_cost: number,
    unit_cost: number,
    selling_price: number,
    expected_loss: number,
    reason: string,
    product: MongoId,
    created_by: MongoId,
    
    _id: MongoId
}

const StockRemoval = model<IStockRemoval>("stock_removal", StockRemovalSchema);
export default StockRemoval;
