import { Schema, model} from "mongoose";
import { MongoId } from "../../interfaces/types";
import { ItemDiscountSchema } from "./sales_item";
import { INVOICE_STATUS } from "../../common/constants/app_constants";
import DateUtils from "../../common/utils/DateUtils";

const SalesDiscountSchema = new Schema({
    discounts: {type: [ItemDiscountSchema], required: true},
    total: {type: Number, min: 0, required: true}
})

const ItemSchema = new Schema({
    sales_item: {type: Schema.Types.ObjectId, ref: "sales_item", required: true},
    name: {type: String, required: true}
})

const SalesSchema = new Schema<ISales>({
    customer: { type: String, required: true, trim: true, index: true},
    items: {type: [ItemSchema], required: true},
    amount: { type: Number, min: 0, required: true},
    vat: { type: Number, min: 0, default: 0},
    total_amount: { type: Number, min: 0, required: true},
    discount: {type: SalesDiscountSchema},
    profit: { type: Number, min: 0, required: true},
    cost: { type: Number, min: 0, required: true},
    uuid: { type: String, required: true, immutable: true, unique: true},
    status: { type: String, default: INVOICE_STATUS.PENDING, enum: Object.values(INVOICE_STATUS)},
    created_by: { type: Schema.Types.ObjectId, ref: "user", required: true},

    day_created: {type: Number},
    week_created: {type: Number},
    month_created: {type: Number},
    year_created: {type: Number},
    week_day_created: {type: String},
    hour_created: {type: Number},
    am_or_pm: {type: String}
}, 
{
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface ISales {
    customer: string,
    items: typeof ItemSchema[],
    amount: number,
    vat: number,
    total_amount: number,
    discount: typeof SalesDiscountSchema,
    profit: number,
    cost: number,
    uuid: string,
    status: string,
    created_by: MongoId,

    day_created: number,
    week_created: number,
    month_created: number,
    year_created: number,
    week_day_created: string,
    hour_created: number,
    am_or_pm: string
    
    _id: MongoId
}

SalesSchema.pre('save', function() {
    return new Promise((resolve) => {
        const dateUtils = new DateUtils();
        if (this.isNew) {
            dateUtils.registerTimestamp(this);
        }
        resolve();
    });
})

const Sales = model<ISales>("sales", SalesSchema);
export default Sales;
