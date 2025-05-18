var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EVENT_STATUS_TYPES } from '../../../../constants/enums';
import Event from '../../../../MongoModels/Event';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getEventsByUserId(parent, { userId }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const events = yield Event.find({
                userId,
                eventStatus: { $ne: EVENT_STATUS_TYPES.CANCELLED },
            }).populate('userId');
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getEventsByUserId',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: userId,
                        paramType: typeof userId,
                    },
                ],
                additionalMessage: 'Event Query Successful',
                startLogId,
            });
            return {
                eventsData: events,
                response: {
                    message: 'Event Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getEventsByUserId',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: userId,
                        paramType: typeof userId,
                    },
                ],
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
//# sourceMappingURL=getEventsByUserId.js.map