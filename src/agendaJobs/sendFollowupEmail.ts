import {languageCode} from '../utils/languageCode';
import Agenda from 'agenda';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import getBusyTimes from '../utils/busyTimes/getBusyTimes';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';
import dayjs from 'dayjs';
import StatusAuthCode from '../MongoModels/StatusAuthCode';

export default async function sendFollowUpEmail(agenda: Agenda) {
  agenda.define('sendFollowUpEmail', async (job, done) => {
    let bookingId;
    try {
      const {
        bookerName,
        bookerEmail,
        providerName,
        providerEmail,
        bookerLanguage,
        providerLanguage,
        providerId,
        startTime,
        endTime,
        providerAuthCode,
        clientAuthCode,
      } = job.attrs.data;

      bookingId = job.attrs.data.bookingId;

      await createApiLog({
        type: ApiLogTypes.API_PROCESSING_END,
        level: ApiLogLevels.INFO,
        functionName: 'sendFollowUpEmail',
        functionParams: [
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
        ],
        additionalMessage: JSON.stringify(job.attrs.data),
        startLogId: `BOOKING_ID ${bookingId}`,
      });

      if (dayjs(endTime).add(36, 'hour').isAfter(dayjs())) {
        await createApiLog({
          type: ApiLogTypes.API_PROCESSING_END,
          level: ApiLogLevels.ERROR,
          functionName: 'sendFollowUpEmail',
          functionParams: [
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
          ],
          additionalMessage: 'Log got stuck',
          startLogId: `BOOKING_ID ${bookingId}`,
        });
      }

      const providerUser = [{_id: providerId}];
      const busyTimes = await getBusyTimes(providerUser, startTime, endTime);
      if (busyTimes.length === 0) {
        await job.remove();
        done();
        return;
      }

      // Email to Client
      await sendEmail(
        {
          clientName: bookerName,
          providerName,
          bookingId,
          confirm: 'client-confirm',
          report: 'client-report',
          clientAuthCode,
          [languageCode(bookerLanguage)]: true,
        },
        bookerEmail,
        TEMPLATES.POST_BOOKING.CLIENT_FOLLOW_UP
      );
      // Email to Provider
      await sendEmail(
        {
          clientName: bookerName,
          providerName,
          bookingId,
          providerAuthCode,
          confirm: 'provider-confirm',
          [languageCode(providerLanguage)]: true,
        },
        providerEmail,
        TEMPLATES.POST_BOOKING.PROVIDER_FOLLOW_UP
      );

      await job.remove();
      done();
    } catch (err) {
      await createApiLog({
        type: ApiLogTypes.API_PROCESSING_END,
        level: ApiLogLevels.ERROR,
        functionName: 'sendFollowUpEmail',
        functionParams: [],
        additionalMessage: err.message,
        startLogId: `BOOKING_ID ${bookingId}`,
      });
      throw err;
    }
  });
}
