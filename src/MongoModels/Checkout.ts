import mongoose from 'mongoose';

const {Schema} = mongoose;

const checkoutSchema = new Schema(
  {
    buyer: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  },
  {collection: 'checkouts', timestamps: true}
);

export default mongoose.model('Checkout', checkoutSchema);
