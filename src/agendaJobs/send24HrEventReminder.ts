import Agenda from 'agenda';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';
import Event from '../MongoModels/Event';
import Attendee from '../MongoModels/Attendee';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function send24HrEventReminder(agenda: Agenda) {
  try {
    agenda.define('send24HrEventReminder', async (job, done) => {
      console.log('running 24 hr reminder ...');
      const {eventId, attendeeDocumentId, attendingDateTime} = job.attrs.data;

      const event = await Event.findById(eventId).populate('userId');
      const attendee = await Attendee.findById(attendeeDocumentId).populate('attendeeId');
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
      await sendEmail(
        attendeeEmailPayload,
        attendee.attendeeId.accountDetails.email,
        TEMPLATES.EVENT.EMAIL_TO_ATTENDEE
      );
      console.log('24Hr reminder email sent!');

      await job.remove();
      done();
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'send24HrEventReminder',
      functionParams: [],
      additionalMessage: err.message,
      startLogId: '',
    });
    throw err;
  }
}
