import { ClientSession, Types } from 'mongoose';
import { DISCOUNT_TYPES } from '../../common/constants/app_constants';
import SalesItem, { ISalesItem } from '../../models/store/sales_item';
import DBService from '../DBService';
import { SalesItemData } from '../../interfaces/interfaces';

class SalesItemService extends DBService<ISalesItem> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(SalesItem, populatedFields);
        
    }

    createSalesItems(data: SalesItemData[], session?: ClientSession): Promise<ISalesItem[]> {
        
        return new Promise(async (resolve, reject) => {
            try {
                const salesItems:any[] = [];
        
                data.forEach(item => {
                    const totalCost = item.unit_cost * item.quantity;
                    let totalPrice = item.price * item.quantity;
                    let discount;
                    if (item.discount) {
                        const discountAmount:number = item.discount.type == DISCOUNT_TYPES.FIXED ? item.discount.amount : (item.discount.amount / 100) * totalPrice;
                        discount = {
                            discount_id: item.discount._id,
                            product_name: item.product_name,
                            amount: discountAmount
                        }
                        totalPrice += discountAmount;
                    }
        
                    const salesItemData = {
                        product: item.product_id,
                        product_name: item.product_name,
                        sales_invoice: item.sales_id,
                        quantity: item.quantity,
                        unit_cost: item.unit_cost,
                        total_cost: totalCost,
                        unit_price: item.price,
                        total_price: totalPrice,
                        profit: totalPrice - totalCost,
                        discount: discount,
                        categories: item.categories,
                        created_by: item.user_id,
                        _id: new Types.ObjectId()
                    }
        
                    salesItems.push(salesItemData);
                })
        
                await this.saveMany(salesItems, session)

                resolve(salesItems);
            } catch (error) {
                reject(error);
            }
        })
    }

}

export default SalesItemService;