import mongoose from 'mongoose';

const {Schema} = mongoose;

const stripeAccountSchema = new Schema(
  {
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true},
    accountId: String,
  },
  {collection: 'stripeAccounts'}
);

export default mongoose.model('StripeAccount', stripeAccountSchema);
