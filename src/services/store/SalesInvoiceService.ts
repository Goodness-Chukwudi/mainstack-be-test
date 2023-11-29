import SalesInvoice, { ISalesInvoice } from '../../models/store/sales_invoice';
import DBService from '../DBService';

class SalesInvoiceService extends DBService<ISalesInvoice> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(SalesInvoice, populatedFields);
        
    }

}

export default SalesInvoiceService;