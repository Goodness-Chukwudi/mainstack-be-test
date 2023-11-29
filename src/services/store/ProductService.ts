import { ClientSession } from 'mongoose';
import Product, { IProduct } from '../../models/store/product';
import DBService from '../DBService';
import SequenceCounter from '../../models/sequence_counter';
import { SEQUENCE_COUNTER_TYPES } from '../../common/constants/app_constants';

class ProductService extends DBService<IProduct> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(Product, populatedFields);
    }

    async generateProductCode(session: ClientSession): Promise<string> {
        const code = await SequenceCounter.getNextNumber(SEQUENCE_COUNTER_TYPES.PRODUCT_CODE, session);
        const productCode = code < 10 ? "PRD0" + code : "PRD" + code;

        return productCode;
    }

}

export default ProductService;