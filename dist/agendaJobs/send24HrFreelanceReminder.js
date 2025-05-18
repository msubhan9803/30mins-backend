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
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
dayjs.extend(utc);
dayjs.extend(timezone);
export default function send24HrFreelanceReminder(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            agenda.define('send24HrFreelanceReminder', (job, done) => __awaiter(this, void 0, void 0, function* () {
                const { bookingId, bookerName, bookerEmail, providerTimeZone, providerName, providerEmail, providerLanguage, bookerPhone, additionalNotes, price, currency, paymentType, meetingDate, percentDonated, charity, startTime, endTime, } = job.attrs.data;
                // Email to Provider
                yield sendEmail({
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
                }, providerEmail, TEMPLATES.POST_BOOKING.FREELANCE_REMINDER_TO_PROVIDER);
                yield job.remove();
                done();
            }));
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.API_PROCESSING_END,
                level: ApiLogLevels.ERROR,
                functionName: 'send24HrFreelanceReminder',
                functionParams: [],
                additionalMessage: err.message,
                startLogId: '',
            });
            throw err;
        }
    });
}
//# sourceMappingURL=send24HrFreelanceReminder.js.map