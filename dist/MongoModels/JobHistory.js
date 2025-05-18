import mongoose from 'mongoose';
const { Schema } = mongoose;
const jobHistorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: {
        type: String,
        maxLength: 50,
        required: true,
    },
    company: {
        type: String,
        maxLength: 254,
        required: true,
    },
    startDate: String,
    endDate: String,
    current: Boolean,
    roleDescription: {
        type: String,
    },
    employmentType: String,
    location: {
        type: String,
        maxLength: 150,
        required: true,
    },
}, { collection: 'jobhistory' });
export default mongoose.model('JobHistory', jobHistorySchema);
//# sourceMappingURL=JobHistory.js.map