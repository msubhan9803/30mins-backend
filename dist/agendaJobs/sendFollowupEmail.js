var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { languageCode } from '../utils/languageCode';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import getBusyTimes from '../utils/busyTimes/getBusyTimes';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
import dayjs from 'dayjs';
export default function sendFollowUpEmail(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        agenda.define('sendFollowUpEmail', (job, done) => __awaiter(this, void 0, void 0, function* () {
            let bookingId;
            try {
                const { bookerName, bookerEmail, providerName, providerEmail, bookerLanguage, providerLanguage, providerId, startTime, endTime, providerAuthCode, clientAuthCode, } = job.attrs.data;
                bookingId = job.attrs.data.bookingId;
                yield createApiLog({
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
                    yield createApiLog({
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
                const providerUser = [{ _id: providerId }];
                const busyTimes = yield getBusyTimes(providerUser, startTime, endTime);
                if (busyTimes.length === 0) {
                    yield job.remove();
                    done();
                    return;
                }
                // Email to Client
                yield sendEmail({
                    clientName: bookerName,
                    providerName,
                    bookingId,
                    confirm: 'client-confirm',
                    report: 'client-report',
                    clientAuthCode,
                    [languageCode(bookerLanguage)]: true,
                }, bookerEmail, TEMPLATES.POST_BOOKING.CLIENT_FOLLOW_UP);
                // Email to Provider
                yield sendEmail({
                    clientName: bookerName,
                    providerName,
                    bookingId,
                    providerAuthCode,
                    confirm: 'provider-confirm',
                    [languageCode(providerLanguage)]: true,
                }, providerEmail, TEMPLATES.POST_BOOKING.PROVIDER_FOLLOW_UP);
                yield job.remove();
                done();
            }
            catch (err) {
                yield createApiLog({
                    type: ApiLogTypes.API_PROCESSING_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'sendFollowUpEmail',
                    functionParams: [],
                    additionalMessage: err.message,
                    startLogId: `BOOKING_ID ${bookingId}`,
                });
                throw err;
            }
        }));
    });
}
//# sourceMappingURL=sendFollowupEmail.js.map