import mongoose from 'mongoose';
const { Schema } = mongoose;
const educationHistorySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    degree: {
        type: String,
        maxLength: 50,
        required: true,
    },
    school: {
        type: String,
        maxLength: 254,
        required: true,
    },
    startDate: String,
    endDate: String,
    current: Boolean,
    graduated: Boolean,
    additionalInfo: {
        type: String,
    },
    extracurricular: {
        type: String,
    },
    fieldOfStudy: {
        type: String,
        maxLength: 50,
        required: true,
    },
}, { collection: 'educationhistory' });
export default mongoose.model('EducationHistory', educationHistorySchema);
//# sourceMappingURL=EducationHistory.js.map