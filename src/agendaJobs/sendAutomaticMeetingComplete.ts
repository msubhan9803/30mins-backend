import Agenda from 'agenda';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BookedMeeting from '../MongoModels/BookedMeeting';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function sendAutomaticMeetingComplete(agenda: Agenda) {
  let bookingId;
  try {
    agenda.define('sendAutomaticMeetingComplete', async (job, done) => {
      const {bookerEmail, providerEmail} = job.attrs.data;

      bookingId = job.attrs.data.bookingId;

      const functionParams = [
        {
          paramName: 'bookingId',
          paramValue: bookingId,
          paramType: typeof bookingId,
        },
        {
          paramName: 'providerEmail',
          paramValue: providerEmail,
          paramType: typeof providerEmail,
        },
        {
          paramName: 'bookerEmail',
          paramValue: bookerEmail,
          paramType: typeof bookerEmail,
        },
      ];

      try {
        await createApiLog({
          type: ApiLogTypes.API_PROCESSING_START,
          level: ApiLogLevels.INFO,
          functionName: 'sendAutomaticMeetingComplete',
          functionParams: functionParams,
          additionalMessage: JSON.stringify(job.attrs.data),
          startLogId: `BOOKING_ID ${bookingId}`,
        });

        const booking = await BookedMeeting.findById(bookingId);
        const {status} = booking;
        if (status.refunded) {
          await createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.INFO,
            functionName: 'sendAutomaticMeetingComplete',
            functionParams: functionParams,
            additionalMessage: '[Automated Completetion Cancelled]: Meeting has been refunded',
            startLogId: `BOOKING_ID ${bookingId}`,
          });
          await job.remove();
          done();
          return;
        }

        if (status.providerConfirmed) {
          await createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.INFO,
            functionName: 'sendAutomaticMeetingComplete',
            functionParams: functionParams,
            additionalMessage: '[Automated Completetion Cancelled]: Provider Confirmed!',
            startLogId: `BOOKING_ID ${bookingId}`,
          });

          await job.remove();
          done();
          return;
        }
        if (status.clientConfirmed) {
          await createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.INFO,
            functionName: 'sendAutomaticMeetingComplete',
            functionParams: functionParams,
            additionalMessage: '[Automated Completetion Cancelled]: Client Confirmed!',
            startLogId: `BOOKING_ID ${bookingId}`,
          });

          await job.remove();
          done();
          return;
        }
        if (status.providerDeclined) {
          await createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.INFO,
            functionName: 'sendAutomaticMeetingComplete',
            functionParams: functionParams,
            additionalMessage: '[Automated Completetion Cancelled]: Provider Declined!',
            startLogId: `BOOKING_ID ${bookingId}`,
          });

          await job.remove();
          done();
          return;
        }
        if (status.providerCanceled) {
          await createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.INFO,
            functionName: 'sendAutomaticMeetingComplete',
            functionParams: functionParams,
            additionalMessage: '[Automated Completetion Cancelled]: Provider Cancelled!',
            startLogId: `BOOKING_ID ${bookingId}`,
          });

          await job.remove();
          done();
          return;
        }
        if (status.clientCanceled) {
          await createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.INFO,
            functionName: 'sendAutomaticMeetingComplete',
            functionParams: functionParams,
            additionalMessage: '[Automated Completetion Cancelled]: Client Cancelled!',
            startLogId: `BOOKING_ID ${bookingId}`,
          });

          await job.remove();
          done();
          return;
        }

        await BookedMeeting.findByIdAndUpdate(bookingId, {
          $set: {
            'status.clientConfirmed': true,
            'status.providerConfirmed': true,
            'status.postMeetingNotes': 'Automatic Completed After 3 Days!',
          },
        });

        await createApiLog({
          type: ApiLogTypes.API_PROCESSING_END,
          level: ApiLogLevels.INFO,
          functionName: 'sendAutomaticMeetingComplete',
          functionParams: functionParams,
          additionalMessage: 'Automated Completetion Completed!',
          startLogId: `BOOKING_ID ${bookingId}`,
        });

        await job.remove();
        done();
      } catch (err) {
        await createApiLog({
          type: ApiLogTypes.API_PROCESSING_END,
          level: ApiLogLevels.ERROR,
          functionName: 'sendAutomaticMeetingComplete',
          functionParams: functionParams,
          additionalMessage: err.message,
          startLogId: `BOOKING_ID ${bookingId}`,
        });
      }
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'sendAutomaticMeetingComplete',
      functionParams: [],
      additionalMessage: err.message,
      startLogId: `BOOKING_ID ${bookingId}`,
    });
    throw err;
  }
}
