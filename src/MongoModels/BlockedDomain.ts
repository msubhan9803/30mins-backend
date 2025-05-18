import mongoose, {SchemaTypes} from 'mongoose';

const {Schema} = mongoose;

const blockedDomainSchema = new Schema(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
    },
    blockReason: {
      type: String,
      required: true,
    },
  },
  {collection: 'blockedDomains'}
);

export default mongoose.model('BlockedDomain', blockedDomainSchema);
