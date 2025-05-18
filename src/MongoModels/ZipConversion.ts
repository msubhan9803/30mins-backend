import mongoose from 'mongoose';

const {Schema} = mongoose;

const zipConversionSchema = new Schema(
  {
    countryCode: String,
    zipCode: String,
    place: String,
    state: String,
    stateCode: String,
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    country: String,
    continent: String,
  },
  {collection: 'zipConversions'}
);

export default mongoose.model('ZipConversion', zipConversionSchema);
