import mongoose from 'mongoose';
const { Schema } = mongoose;
const bookingApprovalSchema = new Schema({
    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    providerEmail: String,
    bookerEmail: String,
    providerName: String,
    bookerName: String,
    authcode: String,
    approvalRequested: Boolean,
    approved: Boolean,
    denied: Boolean,
}, { collection: 'bookingApproval', timestamps: true });
export default mongoose.model('BookingApproval', bookingApprovalSchema);
//# sourceMappingURL=BookingApprovals.js.map