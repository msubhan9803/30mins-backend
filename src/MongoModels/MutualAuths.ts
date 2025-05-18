import mongoose from 'mongoose';

const {Schema, model} = mongoose;

const mutualAuthsSchema = new Schema(
  {
    _id: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    guests: {
      type: [{type: Schema.Types.ObjectId, ref: 'User', required: true}],
      default: [],
    },
  },
  {collection: 'mutualAuths', timestamps: true}
);

export default model('MutualAuth', mutualAuthsSchema);
