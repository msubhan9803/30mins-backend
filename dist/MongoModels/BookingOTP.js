import mongoose from 'mongoose';
const { Schema } = mongoose;
const bookingsOTPSchema = new Schema({
    email: { type: String, required: true },
    otpToken: String,
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    verified: { type: Boolean, default: false },
    expireAt: {
        type: Date,
        default: Date.now,
        expires: 600, // Expire Document 10min from Creation
    },
}, { collection: 'bookingsOTPs', timestamps: true });
export default mongoose.model('bookingOTP', bookingsOTPSchema);
//# sourceMappingURL=BookingOTP.js.map