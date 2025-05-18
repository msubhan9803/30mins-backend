import mongoose from 'mongoose';

const {Schema, Types, model} = mongoose;

const statusAuthCodeSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  bookingId: {
    type: Types.ObjectId,
    ref: 'BookedMeeting',
    required: true,
  },
  authCode: {
    type: String,
    required: true,
  },
  availableStatus: [String],
  expireAt: {
    type: String,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
});

export default model('StatusAuthCode', statusAuthCodeSchema);
