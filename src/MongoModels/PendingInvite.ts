import mongoose from 'mongoose';

const {Schema} = mongoose;

const pendingInviteSchema = new Schema(
  {
    inviteeUserId: {type: Schema.Types.ObjectId, ref: 'User'},
    inviteeEmail: {
      type: String,
      required: true,
    },
    couponCode: String,
    organizationId: {type: Schema.Types.ObjectId, ref: 'Organization'},
    inviterUserId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    expireAt: {
      type: Date,
      default: new Date(new Date().valueOf() + 1000 * 60 * 60 * 72), // 72-hours from Creation
      expires: 10, // Expire Document 10 Seconds After Date
    },
  },
  {collection: 'pendingInvites'}
);

export default mongoose.model('PendingInvite', pendingInviteSchema);
