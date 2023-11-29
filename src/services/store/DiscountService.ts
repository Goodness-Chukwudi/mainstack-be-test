import Discount, { IDiscount } from '../../models/store/discount';
import DBService from '../DBService';

class DiscountService extends DBService<IDiscount> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(Discount, populatedFields);
        
    }

}

export default DiscountService;