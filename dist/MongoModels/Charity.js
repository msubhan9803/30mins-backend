import mongoose from 'mongoose';
const { Schema } = mongoose;
const charitySchema = new Schema({
    name: {
        type: String,
        required: true,
        maxLength: 254,
    },
    taxID: {
        type: String,
        required: true,
    },
    website: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
}, { collection: 'charities' });
export default mongoose.model('Charity', charitySchema);
//# sourceMappingURL=Charity.js.map