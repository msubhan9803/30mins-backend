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

export default async function send15MinEventReminder(agenda: Agenda) {
  try {
    agenda.define('send15MinEventReminder', async (job, done) => {
      console.log('running 15 min reminder ...');
      const {eventId, attendeeDocumentId, attendingDateTime} = job.attrs.data;

      const event = await Event.findById(eventId).populate('userId');
      const attendee = await Attendee.findById(attendeeDocumentId).populate('attendeeId');

      // Email to Attendee
      const attendeeEmailPayload = {
        eventAttendeesMessage: `Reminder: Hey ${attendee.attendeeId.personalDetails.name}, 15 mins left to attend the event ${event.serviceTitle}`,
        eventTitle: event.serviceTitle,
        eventDateTime: dayjs(attendingDateTime).format('ddd, MMM DD, YYYY - hh:mma'),
        eventDescription: event.serviceDescription,
        eventSlug: event.serviceSlug,
        organizerUsername: event.userId.accountDetails.email,
      };
      console.log('15min reminder: attendeeEmailPayload: ', attendeeEmailPayload);
      await sendEmail(
        attendeeEmailPayload,
        attendee.attendeeId.accountDetails.email,
        TEMPLATES.EVENT.EMAIL_TO_ATTENDEE
      );
      console.log('15min reminder email sent!');

      await job.remove();
      done();
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'send15MinEventReminder',
      functionParams: [],
      additionalMessage: err.message,
      startLogId: '',
    });
    throw err;
  }
}
