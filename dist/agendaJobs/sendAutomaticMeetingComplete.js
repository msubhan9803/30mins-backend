var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import BookedMeeting from '../MongoModels/BookedMeeting';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
dayjs.extend(utc);
dayjs.extend(timezone);
export default function sendAutomaticMeetingComplete(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        let bookingId;
        try {
            agenda.define('sendAutomaticMeetingComplete', (job, done) => __awaiter(this, void 0, void 0, function* () {
                const { bookerEmail, providerEmail } = job.attrs.data;
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
                    yield createApiLog({
                        type: ApiLogTypes.API_PROCESSING_START,
                        level: ApiLogLevels.INFO,
                        functionName: 'sendAutomaticMeetingComplete',
                        functionParams: functionParams,
                        additionalMessage: JSON.stringify(job.attrs.data),
                        startLogId: `BOOKING_ID ${bookingId}`,
                    });
                    const booking = yield BookedMeeting.findById(bookingId);
                    const { status } = booking;
                    if (status.refunded) {
                        yield createApiLog({
                            type: ApiLogTypes.API_PROCESSING_END,
                            level: ApiLogLevels.INFO,
                            functionName: 'sendAutomaticMeetingComplete',
                            functionParams: functionParams,
                            additionalMessage: '[Automated Completetion Cancelled]: Meeting has been refunded',
                            startLogId: `BOOKING_ID ${bookingId}`,
                        });
                        yield job.remove();
                        done();
                        return;
                    }
                    if (status.providerConfirmed) {
                        yield createApiLog({
                            type: ApiLogTypes.API_PROCESSING_END,
                            level: ApiLogLevels.INFO,
                            functionName: 'sendAutomaticMeetingComplete',
                            functionParams: functionParams,
                            additionalMessage: '[Automated Completetion Cancelled]: Provider Confirmed!',
                            startLogId: `BOOKING_ID ${bookingId}`,
                        });
                        yield job.remove();
                        done();
                        return;
                    }
                    if (status.clientConfirmed) {
                        yield createApiLog({
                            type: ApiLogTypes.API_PROCESSING_END,
                            level: ApiLogLevels.INFO,
                            functionName: 'sendAutomaticMeetingComplete',
                            functionParams: functionParams,
                            additionalMessage: '[Automated Completetion Cancelled]: Client Confirmed!',
                            startLogId: `BOOKING_ID ${bookingId}`,
                        });
                        yield job.remove();
                        done();
                        return;
                    }
                    if (status.providerDeclined) {
                        yield createApiLog({
                            type: ApiLogTypes.API_PROCESSING_END,
                            level: ApiLogLevels.INFO,
                            functionName: 'sendAutomaticMeetingComplete',
                            functionParams: functionParams,
                            additionalMessage: '[Automated Completetion Cancelled]: Provider Declined!',
                            startLogId: `BOOKING_ID ${bookingId}`,
                        });
                        yield job.remove();
                        done();
                        return;
                    }
                    if (status.providerCanceled) {
                        yield createApiLog({
                            type: ApiLogTypes.API_PROCESSING_END,
                            level: ApiLogLevels.INFO,
                            functionName: 'sendAutomaticMeetingComplete',
                            functionParams: functionParams,
                            additionalMessage: '[Automated Completetion Cancelled]: Provider Cancelled!',
                            startLogId: `BOOKING_ID ${bookingId}`,
                        });
                        yield job.remove();
                        done();
                        return;
                    }
                    if (status.clientCanceled) {
                        yield createApiLog({
                            type: ApiLogTypes.API_PROCESSING_END,
                            level: ApiLogLevels.INFO,
                            functionName: 'sendAutomaticMeetingComplete',
                            functionParams: functionParams,
                            additionalMessage: '[Automated Completetion Cancelled]: Client Cancelled!',
                            startLogId: `BOOKING_ID ${bookingId}`,
                        });
                        yield job.remove();
                        done();
                        return;
                    }
                    yield BookedMeeting.findByIdAndUpdate(bookingId, {
                        $set: {
                            'status.clientConfirmed': true,
                            'status.providerConfirmed': true,
                            'status.postMeetingNotes': 'Automatic Completed After 3 Days!',
                        },
                    });
                    yield createApiLog({
                        type: ApiLogTypes.API_PROCESSING_END,
                        level: ApiLogLevels.INFO,
                        functionName: 'sendAutomaticMeetingComplete',
                        functionParams: functionParams,
                        additionalMessage: 'Automated Completetion Completed!',
                        startLogId: `BOOKING_ID ${bookingId}`,
                    });
                    yield job.remove();
                    done();
                }
                catch (err) {
                    yield createApiLog({
                        type: ApiLogTypes.API_PROCESSING_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'sendAutomaticMeetingComplete',
                        functionParams: functionParams,
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
                functionName: 'sendAutomaticMeetingComplete',
                functionParams: [],
                additionalMessage: err.message,
                startLogId: `BOOKING_ID ${bookingId}`,
            });
            throw err;
        }
    });
}
//# sourceMappingURL=sendAutomaticMeetingComplete.js.map