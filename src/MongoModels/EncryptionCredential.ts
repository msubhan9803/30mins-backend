import mongoose from 'mongoose';

const {Schema} = mongoose;

const EncryptionCredentialSchema = new Schema(
  {
    algorithm: {type: String, required: true},
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    secret: {type: String, required: true},
    version: {type: String, required: true},
    createdDate: {type: Date, default: Date.now},
  },
  {collection: 'encryptionCredentials'}
);

export default mongoose.model('EncryptionCredential', EncryptionCredentialSchema);
