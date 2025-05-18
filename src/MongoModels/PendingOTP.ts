import mongoose from 'mongoose';

const {Schema} = mongoose;

const pendingOTPSchema = new Schema(
  {
    email: String,
    phone: String,
    name: String,
    otpToken: String,
    expireAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Expire Document 10min from Creation
    },
  },
  {collection: 'pendingOTPs'}
);

export default mongoose.model('PendingOTP', pendingOTPSchema);
