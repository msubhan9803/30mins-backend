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
import { languageCode } from '../utils/languageCode';
import getBusyTimes from '../utils/busyTimes/getBusyTimes';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
import sendSms from '../utils/sendSms';
dayjs.extend(utc);
dayjs.extend(timezone);
export default function send15MinReminder(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        let bookingId;
        try {
            agenda.define('send15MinReminder', (job, done) => __awaiter(this, void 0, void 0, function* () {
                const { title, bookerName, bookerEmail, bookerTimeZone, bookerLanguage, providerTimeZone, providerName, providerEmail, providerLanguage, bookerPhone, additionalNotes, meetingCount, price, currency, paymentType, conferenceLink, zoomJoinUrl, zoomStartUrl, zoomPassword, meetingDate, percentDonated, charity, conferenceType, startTime, endTime, meetingDuration, ccRecipients, providerId, providerAuthCode, clientAuthCode, smsSettings, } = job.attrs.data;
                bookingId = job.attrs.data.bookingId;
                try {
                    yield createApiLog({
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
                        yield createApiLog({
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
                        yield job.remove();
                        done();
                        return;
                    }
                    const providerUser = [{ _id: providerId }];
                    const busyTimes = yield getBusyTimes(providerUser, startTime, endTime);
                    if (busyTimes.length === 0) {
                        yield job.remove();
                        done();
                        return;
                    }
                    // Email to Client
                    yield sendEmail({
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
                    }, bookerEmail, TEMPLATES.POST_BOOKING.REMINDER_TO_CLIENT);
                    // Email to Provider
                    yield sendEmail({
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
                    }, providerEmail, TEMPLATES.POST_BOOKING.REMINDER_TO_PROVIDER);
                    // Emails to CC
                    ccRecipients.forEach((ccRecipent) => __awaiter(this, void 0, void 0, function* () {
                        const { ccEmail, language } = ccRecipent;
                        if (ccEmail && ccEmail !== '') {
                            yield sendEmail({
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
                            }, ccEmail, TEMPLATES.POST_BOOKING.REMINDER_TO_CLIENT);
                        }
                    }));
                    if (smsSettings.bookerSms.reminders) {
                        yield sendSms(`30mins.com - Meeting with ${providerName} starting in 15min: https://30mins.com/user/meetingDetails/${bookingId}`, smsSettings.bookerSms.phone);
                    }
                    if (smsSettings.providerSms.reminders) {
                        yield sendSms(`30mins.com - Meeting with ${bookerName} starting in 15min: https://30mins.com/user/meetingDetails/${bookingId}`, smsSettings.providerSms.phone);
                    }
                    yield job.remove();
                    done();
                }
                catch (err) {
                    yield createApiLog({
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
            }));
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.API_PROCESSING_END,
                level: ApiLogLevels.ERROR,
                functionName: 'send15MinReminder',
                functionParams: [],
                additionalMessage: err.message,
                startLogId: `BOOKING_ID ${bookingId}`,
            });
            throw err;
        }
    });
}
//# sourceMappingURL=send15MinReminder.js.map