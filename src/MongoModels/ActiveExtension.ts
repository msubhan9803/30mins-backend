import mongoose, {SchemaTypes} from 'mongoose';

const {Schema} = mongoose;

const activeExtensionSchema = new Schema(
  {
    createdDate: {
      type: Date,
      default: Date.now,
    },
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    extensionTitle: {
      type: String,
      required: true,
    },
    extensionProductId: {
      type: String,
      required: true,
    },
    paymentMethodId: {
      type: String,
      required: true,
    },
    subscriptionId: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
  },
  {collection: 'activeExtensions'}
);

export default mongoose.model('ActiveExtension', activeExtensionSchema);
