import { Schema, model} from "mongoose";
import { ITEM_STATUS } from "../../common/constants/app_constants";
import { MongoId } from "../../interfaces/types";

const ProductPhotoSchema = new Schema<IProductPhoto>({
    url: {type: String, required: true},
    thumbnail_url: {type: String, required: true},
    mime_type: {type: String},
    extension: {type: String},
    size: {type: Number},
    public_id: {type: String},
    is_main: {type: Boolean, required: false},
    product: { type: Schema.Types.ObjectId, ref: "product"},
    status: { type: String, default: ITEM_STATUS.ACTIVE, enum: Object.values(ITEM_STATUS) },
    created_by: { type: Schema.Types.ObjectId, ref: "user"}
}, 
{
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export interface IProductPhoto {
    url: string,
    thumbnail_url: string,
    mime_type: string,
    extension: string,
    size: number,
    public_id: string,
    is_main: boolean,
    product: MongoId,
    status: string,
    created_by: MongoId
    
    _id: MongoId
}

const ProductPhoto = model<IProductPhoto>("product_photo", ProductPhotoSchema);
export default ProductPhoto;
