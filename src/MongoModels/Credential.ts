import mongoose from 'mongoose';

const {Schema} = mongoose;

const credentialSchema = new Schema(
  {
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    type: String,
    credentialIdentifier: String,
    credentials: Schema.Types.Mixed,
    allowedProviders: [String],
    userEmail: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {collection: 'credentials'}
);

export default mongoose.model('Credential', credentialSchema);
