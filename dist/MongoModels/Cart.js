import mongoose from 'mongoose';
const { Schema } = mongoose;
const cartSchema = new Schema({
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'ProductQtt', required: true }],
}, { collection: 'carts', timestamps: true });
export default mongoose.model('Cart', cartSchema);
//# sourceMappingURL=Cart.js.map