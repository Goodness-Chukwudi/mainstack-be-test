import SalesItem, { ISalesItem } from '../../models/store/sales_item';
import DBService from '../DBService';

class SalesItemService extends DBService<ISalesItem> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(SalesItem, populatedFields);
        
    }

}

export default SalesItemService;