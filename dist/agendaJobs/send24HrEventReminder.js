var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
import Event from '../MongoModels/Event';
import Attendee from '../MongoModels/Attendee';
dayjs.extend(utc);
dayjs.extend(timezone);
export default function send24HrEventReminder(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            agenda.define('send24HrEventReminder', (job, done) => __awaiter(this, void 0, void 0, function* () {
                console.log('running 24 hr reminder ...');
                const { eventId, attendeeDocumentId, attendingDateTime } = job.attrs.data;
                const event = yield Event.findById(eventId).populate('userId');
                const attendee = yield Attendee.findById(attendeeDocumentId).populate('attendeeId');
                console.log('attendee: ', attendee);
                // Email to Attendee
                const attendeeEmailPayload = {
                    eventAttendeesMessage: `Reminder: Hey ${attendee.attendeeId.personalDetails.name}, 24 Hours left to attend the event ${event.serviceTitle}`,
                    eventTitle: event.serviceTitle,
                    eventDateTime: dayjs(attendingDateTime).format('ddd, MMM DD, YYYY - hh:mma'),
                    eventDescription: event.serviceDescription,
                    eventSlug: event.serviceSlug,
                    organizerUsername: event.userId.accountDetails.email,
                };
                console.log('24Hr reminder: attendeeEmailPayload: ', attendeeEmailPayload);
                yield sendEmail(attendeeEmailPayload, attendee.attendeeId.accountDetails.email, TEMPLATES.EVENT.EMAIL_TO_ATTENDEE);
                console.log('24Hr reminder email sent!');
                yield job.remove();
                done();
            }));
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.API_PROCESSING_END,
                level: ApiLogLevels.ERROR,
                functionName: 'send24HrEventReminder',
                functionParams: [],
                additionalMessage: err.message,
                startLogId: '',
            });
            throw err;
        }
    });
}
//# sourceMappingURL=send24HrEventReminder.js.map