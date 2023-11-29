import StockEntry, { IStockEntry } from '../../models/store/stock_entry';
import DBService from '../DBService';

class StockEntryService extends DBService<IStockEntry> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(StockEntry, populatedFields);
        
    }

}

export default StockEntryService;