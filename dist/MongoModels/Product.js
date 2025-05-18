import mongoose from 'mongoose';
import { PRODUCT_TYPES } from '../constants/enums';
const { Schema } = mongoose;
const productSchema = new Schema({
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
    },
    discount: { type: Number },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    tags: [String],
    isDeleted: { type: Boolean, default: false },
    type: {
        type: String,
        enum: [PRODUCT_TYPES.Digital, PRODUCT_TYPES.Physical],
        default: PRODUCT_TYPES.Digital,
    },
    file: {
        name: {
            type: String,
        },
        link: {
            type: String,
        },
    },
    resText: {
        type: String,
    },
    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    serviceMessage: {
        type: String,
    },
    totalFileDownloads: Number,
    totalPurchases: Number,
}, { collection: 'products', timestamps: true });
export default mongoose.model('Product', productSchema);
//# sourceMappingURL=Product.js.map