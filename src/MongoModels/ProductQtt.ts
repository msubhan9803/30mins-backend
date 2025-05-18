import mongoose from 'mongoose';
import {PRODUCTQTT_REFUND_TYPES} from '../constants/enums';

const {Schema} = mongoose;

const productQttSchema = new Schema(
  {
    quantity: {type: Number},
    product: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
    buyerId: {type: Schema.Types.ObjectId, ref: 'User', required: false},
    checkout: {type: Schema.Types.ObjectId, ref: 'Checkout', required: false},
    checkoutPrice: {
      type: Number,
    },
    refundRequested: {type: Boolean, default: false},
    refundStatus: {
      type: String,
      enum: [
        PRODUCTQTT_REFUND_TYPES.REFUNDED,
        PRODUCTQTT_REFUND_TYPES.REFUND_DENIED,
        PRODUCTQTT_REFUND_TYPES.PENDING_ACTION,
        PRODUCTQTT_REFUND_TYPES.NONE,
      ],
      default: PRODUCTQTT_REFUND_TYPES.NONE,
    },
    refundReason: {type: String, default: null},
    shippingAddress: {type: String, default: null},
    authCode: {type: String, default: null},
    authCodeUsed: {type: Boolean, default: false},
  },
  {collection: 'productQtts', timestamps: true}
);

export default mongoose.model('ProductQtt', productQttSchema);
