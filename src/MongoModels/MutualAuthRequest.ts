import mongoose from 'mongoose';

const {Schema, model} = mongoose;

const MutualAuthRequest = new Schema(
  {
    sender: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    receiver: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    origin: {
      type: String,
      default: 'https://30mins.com',
    },
    authCode: {
      type: String,
      required: true,
    },
  },
  {collection: 'mutualAuthRequest', timestamps: true}
);

export default model('MutualAuthRequest', MutualAuthRequest);
