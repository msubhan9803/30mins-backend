import Agenda from 'agenda';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {languageCode} from '../utils/languageCode';
import getBusyTimes from '../utils/busyTimes/getBusyTimes';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';
import sendSms from '../utils/sendSms';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function send15MinReminder(agenda: Agenda) {
  let bookingId;
  try {
    agenda.define('send15MinReminder', async (job, done) => {
      const {
        title,
        bookerName,
        bookerEmail,
        bookerTimeZone,
        bookerLanguage,
        providerTimeZone,
        providerName,
        providerEmail,
        providerLanguage,
        bookerPhone,
        additionalNotes,
        meetingCount,
        price,
        currency,
        paymentType,
        conferenceLink,
        zoomJoinUrl,
        zoomStartUrl,
        zoomPassword,
        meetingDate,
        percentDonated,
        charity,
        conferenceType,
        startTime,
        endTime,
        meetingDuration,
        ccRecipients,
        providerId,
        providerAuthCode,
        clientAuthCode,
        smsSettings,
      } = job.attrs.data;

      bookingId = job.attrs.data.bookingId;

      try {
        await createApiLog({
          type: ApiLogTypes.API_PROCESSING_END,
          level: ApiLogLevels.INFO,
          functionName: 'send15MinReminder',
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

        if (dayjs(startTime).isBefore(dayjs())) {
          await createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.ERROR,
            functionName: 'send15MinReminder',
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
            additionalMessage: 'Log got stuck, and reminder has been removed',
            startLogId: `BOOKING_ID ${bookingId}`,
          });

          await job.remove();
          done();
          return;
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
            serviceTitle: title,
            clientName: bookerName,
            providerName,
            meetingDate: dayjs(startTime).tz(bookerTimeZone).format('MM-DD-YYYY'),
            meetingTime: dayjs(startTime).tz(bookerTimeZone).format('hh:mma'),
            meetingDuration,
            multipleMeetings: meetingCount > 1,
            isPaid: ['escrow', 'direct'].includes(paymentType),
            isEscrow: paymentType === 'escrow',
            currency,
            totalAmount: price,
            charityName: charity,
            donationAmount: percentDonated,
            bookingId,
            reminder15min: true,
            meetingType: conferenceType,
            conferenceLink,
            zoomJoinUrl,
            zoomPassword,
            additionalNotes,
            authCode: clientAuthCode,
            cancel: 'client-cancel',
            [languageCode(bookerLanguage)]: true,
          },
          bookerEmail,
          TEMPLATES.POST_BOOKING.REMINDER_TO_CLIENT
        );
        // Email to Provider
        await sendEmail(
          {
            serviceTitle: title,
            clientName: bookerName,
            clientEmail: bookerEmail,
            clientPhone: bookerPhone,
            providerName,
            meetingDate: dayjs(startTime).tz(providerTimeZone).format('MM-DD-YYYY'),
            meetingTime: dayjs(startTime).tz(providerTimeZone).format('hh:mma'),
            meetingDuration,
            multipleMeetings: meetingCount > 1,
            isPaid: ['escrow', 'direct'].includes(paymentType),
            isEscrow: paymentType === 'escrow',
            currency,
            totalAmount: price,
            charityName: charity,
            donationAmount: percentDonated,
            bookingId,
            reminder15min: true,
            meetingType: conferenceType,
            conferenceLink,
            zoomJoinUrl,
            zoomStartUrl,
            zoomPassword,
            additionalNotes,
            [languageCode(providerLanguage)]: true,
            cancel: 'provider-cancel',
            decline: 'provider-decline',
            authCode: providerAuthCode,
          },
          providerEmail,
          TEMPLATES.POST_BOOKING.REMINDER_TO_PROVIDER
        );

        // Emails to CC
        ccRecipients.forEach(async (ccRecipent: any) => {
          const {ccEmail, language} = ccRecipent;
          if (ccEmail && ccEmail !== '') {
            await sendEmail(
              {
                serviceTitle: title,
                clientName: ccEmail,
                providerName,
                meetingDate: dayjs(startTime).tz(bookerTimeZone).format('MM-DD-YYYY'),
                meetingTime: `${dayjs(startTime)
                  .tz(bookerTimeZone)
                  .format('hh:mma')} - ${bookerTimeZone}`,
                meetingDuration,
                multipleMeetings: meetingCount > 1,
                isPaid: ['escrow', 'direct'].includes(paymentType),
                isEscrow: paymentType === 'escrow',
                currency,
                totalAmount: price,
                charityName: charity,
                donationAmount: percentDonated,
                bookingId,
                reminder15min: true,
                meetingType: conferenceType,
                conferenceLink,
                zoomJoinUrl,
                zoomPassword,
                additionalNotes,

                [languageCode(language)]: true,
              },
              ccEmail,
              TEMPLATES.POST_BOOKING.REMINDER_TO_CLIENT
            );
          }
        });

        if (smsSettings.bookerSms.reminders) {
          await sendSms(
            `30mins.com - Meeting with ${providerName} starting in 15min: https://30mins.com/user/meetingDetails/${bookingId}`,
            smsSettings.bookerSms.phone
          );
        }

        if (smsSettings.providerSms.reminders) {
          await sendSms(
            `30mins.com - Meeting with ${bookerName} starting in 15min: https://30mins.com/user/meetingDetails/${bookingId}`,
            smsSettings.providerSms.phone
          );
        }

        await job.remove();
        done();
      } catch (err) {
        await createApiLog({
          type: ApiLogTypes.API_PROCESSING_END,
          level: ApiLogLevels.ERROR,
          functionName: 'send15MinReminder',
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
          additionalMessage: err.message,
          startLogId: `BOOKING_ID ${bookingId}`,
        });
      }
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'send15MinReminder',
      functionParams: [],
      additionalMessage: err.message,
      startLogId: `BOOKING_ID ${bookingId}`,
    });
    throw err;
  }
}
