var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
export default function updateCalendarEventIds(parent, { bookingId, events }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token } = context;
        const SECRETS = yield AwsSecrets.getInstance();
        let startLogId;
        const functionParams = [
            {
                paramName: 'bookingId',
                paramValue: bookingId,
                paramType: typeof bookingId,
            },
            {
                paramName: 'events',
                paramValue: events,
                paramType: typeof events,
            },
            {
                paramName: 'token',
                paramValue: 'HIDDEN_TOKEN',
                paramType: typeof token,
            },
        ];
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'updateCalendarEventIds',
                functionParams: functionParams,
            });
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateCalendarEventIds',
                    functionParams,
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const data = { $set: {} };
            if (events.google) {
                data.$set.googleCalendarEvent = events === null || events === void 0 ? void 0 : events.google;
            }
            if (events.office) {
                data.$set.officeCalendarEvent = events === null || events === void 0 ? void 0 : events.office;
            }
            yield BookedMeeting.findByIdAndUpdate(bookingId, Object.assign({}, data), ['_id']).orFail(() => {
                throw new Error('Document not Found!');
            });
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'updateCalendarEventIds',
                functionParams: functionParams,
                additionalMessage: 'Events Added successfully!',
                startLogId,
            });
            return {
                message: 'Events Added successfully!',
                status: 200,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'BookedMeeting validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateCalendarEventIds',
                    functionParams,
                    additionalMessage: 'Mongoose BookedMeeting Validation Failed',
                    startLogId,
                });
                return {
                    response: {
                        message: err.message,
                        status: 400,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'updateCalendarEventIds',
                functionParams,
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=updateCalendarEventIds.js.map