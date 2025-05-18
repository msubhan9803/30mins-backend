import mongoose from 'mongoose';
const { Schema } = mongoose;
const publicationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    headline: {
        type: String,
        maxLength: 160,
        required: true,
    },
    url: {
        type: String,
        maxLength: 254,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    image: String,
    description: {
        type: String,
        required: true,
    },
}, { collection: 'publications' });
export default mongoose.model('Publication', publicationSchema);
//# sourceMappingURL=Publication.js.map