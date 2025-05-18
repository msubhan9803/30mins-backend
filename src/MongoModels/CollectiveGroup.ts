import mongoose from 'mongoose';

const {Schema} = mongoose;

const collectiveGroupSchema = new Schema(
  {
    name: {type: String, required: true},
    ownerID: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    guestIDs: [{type: Schema.Types.ObjectId, ref: 'User'}],
  },
  {collection: 'collectivegroup'}
);

export default mongoose.model('CollectiveGroup', collectiveGroupSchema);
