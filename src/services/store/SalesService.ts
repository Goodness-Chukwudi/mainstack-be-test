import { ClientSession } from 'mongoose';
import { INVOICE_STATUS, PRODUCT_STATUS, VAT } from '../../common/constants/app_constants';
import { IItemsObject, ProcessedItemsObject } from '../../interfaces/interfaces';
import { ErrorResponseData } from '../../interfaces/types';
import Sales, { ISales } from '../../models/store/sales';
import DBService from '../DBService';
import ProductService from './ProductService';
import { ISalesItem } from '../../models/store/sales_item';

class SalesService extends DBService<ISales> {

    productService: ProductService;

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(Sales, populatedFields);
        
    }

    async fetchSalesItemsProducts(items: any[], session: ClientSession): Promise<IItemsObject> {
        this.productService = new ProductService(["discount"]);
        return new Promise(async (resolve, reject) => {
            try {
                const response:IItemsObject = {
                    error: undefined,
                    data: []
                }

                const errorResponseData:ErrorResponseData = {
                    in_active_products: [],
                    insufficient_quantity: []
                };
                let hasError = false;
        
                const itemsObject: Record<string,ProcessedItemsObject> = {};
        
                const productIds: string[] = [];
                items.forEach(item => {
                    productIds.push(item.product);
                    //@ts-ignore
                    itemsObject[item.product] = {quantity: item.quantity, product: item.product};
                });
        
                const products = await this.productService.findAndPopulate({_id: {$in: productIds}}, [], [], null, session);
                products.forEach(product => {
                    const item = itemsObject[product._id.toString()];
                    if (item) {
                        item.name = product.name;
                        item.price = product.price;
                        item.cost = product.cost;
                        item.code = product.code;
                        item.categories = product.categories;
                        item.available_quantity = product.available_quantity;
                        item.discount = product.discount;
        
                        itemsObject[product._id.toString()] = item;
                    }
        
                    if (product.status != PRODUCT_STATUS.ACTIVE) {
                        const errorData = {_id: product._id, name: product.name, status: product.status};
                        errorResponseData.in_active_products.push(errorData);
                        hasError = true;
                    }
                    if (product.available_quantity < item.quantity) {
                        const errorData = {_id: product._id, name: product.name, quantity: product.available_quantity};
                        errorResponseData.insufficient_quantity.push(errorData);
                        hasError = true;
                    }
                });

                if (hasError) response.error = errorResponseData;
                else response.data = Object.values(itemsObject);
                
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    }

    createSales(salesItems: ISalesItem[], customer: string, uuid: string, session: ClientSession): Promise<ISales> {

        return new Promise(async (resolve, reject) => {
            try {
                const items:any = [];
                let amount = 0;
                const discounts: any[] = [];
                let totalDiscounts = 0
                let profits = 0
                let totalCost = 0
        
                salesItems.forEach(item => {
                    items.push({sales_item: item._id, name: item.product_name});
                    amount += item.total_price;
                    discounts.push(item.discount.discount_id);
                    totalDiscounts += item.discount.amount as unknown as number;
                    profits += item.profit;
                    totalCost += item.total_cost
                });
                
                const vat = amount * (VAT/100)
        
                const salesInvoiceData = {
                    customer: customer,
                    items: items,
                    amount: amount,
                    vat: vat,
                    total_amount: amount + vat,
                    discount: {discounts, totalDiscounts},
                    profit: profits,
                    cost: totalCost,
                    uuid: uuid,
                    status: INVOICE_STATUS.PAID,
                    created_by: salesItems[0].created_by,
                    _id: salesItems[0].sales_invoice
                }
        
                const salesInvoice = await this.save(salesInvoiceData, session);
                resolve(salesInvoice);
            } catch (error) {
                reject(error);
            }
        })
    }
 }

export default SalesService;