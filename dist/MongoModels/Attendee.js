import mongoose from 'mongoose';
import { ATTENDEE_STATUS_TYPES } from '../constants/enums';
const { Schema } = mongoose;
const attendeeSchema = new Schema({
    attendeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    answeredQuestions: [
        {
            questionType: {
                type: String,
            },
            question: {
                type: String,
            },
            answer: {
                type: String,
            },
            selectedOptions: {
                type: [String],
            },
        },
    ],
    registeredDateTime: { type: String, default: null },
    attendingDateTime: { type: String, default: null },
    attendeeStatus: {
        type: String,
        enum: [ATTENDEE_STATUS_TYPES.REGISTERED, ATTENDEE_STATUS_TYPES.CANCELLED],
        default: ATTENDEE_STATUS_TYPES.REGISTERED,
    },
}, { collection: 'attendee', timestamps: true });
export default mongoose.model('Attendee', attendeeSchema);
//# sourceMappingURL=Attendee.js.map