import Product, { IProduct } from '../../models/store/products';
import DBService from '../DBService';

class ProductService extends DBService<IProduct> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(Product, populatedFields);
        
    }

}

export default ProductService;