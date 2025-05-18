import mongoose from 'mongoose';

const {Schema} = mongoose;

const PendingPayoutSchema = new Schema(
  {
    providerEmail: {type: String, required: true},
    providerPayoutMethod: {
      payoutType: String,
      payoutId: String,
    },
    bookerEmail: {type: String, required: true},
    amountToRelease: {type: Number, required: true},
    bookingId: {type: Schema.Types.ObjectId, ref: 'BookedMeeting', required: true},
    status: {type: String, required: true},
    dateReleased: {type: Date},
  },
  {collection: 'pendingPayouts', timestamps: true}
);

const PendingPayout = mongoose.model('PendingPayout', PendingPayoutSchema);
export default PendingPayout;
