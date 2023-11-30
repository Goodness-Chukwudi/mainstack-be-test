import { Schema, model} from "mongoose";
import { MongoId } from "../../interfaces/types";
import { ItemDiscountSchema } from "./sales_item";
import { INVOICE_STATUS } from "../../common/constants/app_constants";
import DateUtils from "../../common/utils/DateUtils";
import mongoosePagination from "mongoose-paginate-v2";

const SalesDiscountSchema = {
    discounts: {type: [ItemDiscountSchema], required: true},
    total: {type: Number, min: 0, required: true}
}

const ItemSchema = {
    sales_item: {type: Schema.Types.ObjectId, ref: "sales_item", required: true},
    name: {type: String, required: true}
}

const SalesSchema = new Schema<ISales>({
    customer: { type: String, required: true, trim: true, index: true},
    items: {type: [ItemSchema], required: true},
    amount: { type: Number, min: 0, required: true},
    vat: { type: Number, min: 0, default: 0},
    total_amount: { type: Number, min: 0, required: true},
    discount: {type: SalesDiscountSchema, description: "all the discounts applied to this sales"},
    profit: { type: Number, min: 0, required: true, description: "profit made from the sales"},
    cost: { type: Number, min: 0, required: true, description: "cost of the products sold"},
    uuid: { type: String, required: true, immutable: true, unique: true},
    status: { type: String, default: INVOICE_STATUS.PENDING, enum: Object.values(INVOICE_STATUS)},
    created_by: { type: Schema.Types.ObjectId, ref: "user", required: true},
   
    //Helps with further break down of sales analysis
    //Easily provides insights on the hourly, daily, weekly, monthly etc, sales performance
    //E.g week_day_created helps provide insights as to how sales perform on each day of the week (Mon -Fri)
    //Thus specifying which days the store makes most/least sales
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

SalesSchema.plugin(mongoosePagination);
const Sales = model<ISales>("sales", SalesSchema);
export default Sales;
