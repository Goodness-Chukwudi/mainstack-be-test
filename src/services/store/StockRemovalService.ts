import StockRemoval, { IStockRemoval } from '../../models/store/stock_removal';
import DBService from '../DBService';

class StockRemovalService extends DBService<IStockRemoval> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(StockRemoval, populatedFields);
        
    }

}

export default StockRemovalService;