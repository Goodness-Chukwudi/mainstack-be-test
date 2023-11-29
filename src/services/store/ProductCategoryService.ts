import Discount, { IDiscount } from '../../models/store/discount';
import DBService from '../DBService';

class ProductCategoryService extends DBService<IDiscount> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(Discount, populatedFields);
        
    }

}

export default ProductCategoryService;