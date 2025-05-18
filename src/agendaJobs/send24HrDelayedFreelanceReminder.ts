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

export default async function send24HrDelayedFreelanceReminder(agenda: Agenda) {
  try {
    agenda.define('send24HrDelayedFreelanceReminder', async (job, done) => {
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
        TEMPLATES.POST_BOOKING.FREELANCE_DELAYED_REMINDER_TO_PROVIDER
      );

      if (dayjs().diff(dayjs(startTime), 'days') < 14) {
        const newDelayEmailScheduledTime = dayjs().add(1, 'day').toDate();
        await agenda.schedule(
          newDelayEmailScheduledTime,
          'send24HrDelayedFreelanceReminder',
          job.attrs.data
        );
      }

      await job.remove();
      done();
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'send24HrDelayedFreelanceReminder',
      functionParams: [],
      additionalMessage: err.message,
      startLogId: '',
    });
    throw err;
  }
}
