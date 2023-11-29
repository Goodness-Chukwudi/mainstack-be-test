import ProductPhoto, { IProductPhoto } from '../../models/store/product_photo';
import DBService from '../DBService';

class ProductPhotosService extends DBService<IProductPhoto> {

    constructor(populatedFields:string[]|Record<string,string>[] = []) {
        super(ProductPhoto, populatedFields);
        
    }

}

export default ProductPhotosService;