import mongoose from 'mongoose';
const { Schema } = mongoose;
const pendingJoinRequestSchema = new Schema({
    requesterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    expireAt: {
        type: Date,
        default: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 5),
        expires: 10, // Expire Document 10 Seconds After Date
    },
}, { collection: 'pendingJoinRequests' });
export default mongoose.model('PendingJoinRequest', pendingJoinRequestSchema);
//# sourceMappingURL=PendingJoinRequest.js.map