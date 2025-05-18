import Agenda from 'agenda';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {languageCode} from '../utils/languageCode';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function send24HrFreelanceReminder(agenda: Agenda) {
  try {
    agenda.define('send24HrFreelanceReminder', async (job, done) => {
      const {
        bookingId,
        bookerName,
        bookerEmail,
        providerTimeZone,
        providerName,
        providerEmail,
        providerLanguage,
        bookerPhone,
        additionalNotes,
        price,
        currency,
        paymentType,
        meetingDate,
        percentDonated,
        charity,
        startTime,
        endTime,
      } = job.attrs.data;

      // Email to Provider
      await sendEmail(
        {
          clientName: bookerName,
          clientEmail: bookerEmail,
          clientPhone: bookerPhone,
          providerName,
          meetingDate: dayjs(startTime).tz(providerTimeZone).format('ddd, MMM DD, YYYY'),
          startTime: dayjs(startTime).tz(providerTimeZone).format('ddd, MMM DD, YYYY - hh:mma'),
          endTime: dayjs(endTime).tz(providerTimeZone).format('ddd, MMM DD, YYYY - hh:mma'),
          isEscrow: paymentType === 'escrow',
          currency,
          totalAmount: price,
          charityName: charity,
          donationAmount: percentDonated,
          bookingId,
          reminder15min: false,
          additionalNotes,
          [languageCode(providerLanguage)]: true,
        },
        providerEmail,
        TEMPLATES.POST_BOOKING.FREELANCE_REMINDER_TO_PROVIDER
      );

      await job.remove();

      done();
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'send24HrFreelanceReminder',
      functionParams: [],
      additionalMessage: err.message,
      startLogId: '',
    });
    throw err;
  }
}
