import Sales, { ISales } from '../../models/store/sales';
import DBService from '../DBService';

class SalesService extends DBService<ISales> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(Sales, populatedFields);
        
    }

}

export default SalesService;