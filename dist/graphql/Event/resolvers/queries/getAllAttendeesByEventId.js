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
import Attendee from '../../../../MongoModels/Attendee';
import Event from '../../../../MongoModels/Event';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getAllAttendeesByEventId(parent, { eventId }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getAllAttendeesByEventId',
                functionParams: [
                    {
                        paramName: 'eventId',
                        paramValue: eventId,
                        paramType: typeof eventId,
                    },
                ],
            });
            const attendees = yield Attendee.find({ eventId }).populate('attendeeId').populate('eventId');
            const event = yield Event.findOne({
                _id: eventId,
                eventStatus: { $ne: EVENT_STATUS_TYPES.CANCELLED },
            }).populate('userId');
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getAllAttendeesByEventId',
                functionParams: [
                    {
                        paramName: 'eventId',
                        paramValue: eventId,
                        paramType: typeof eventId,
                    },
                ],
                additionalMessage: 'Attendees Query Successful',
                startLogId,
            });
            return {
                attendees,
                eventData: event,
                response: {
                    message: 'Attendees Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getAllAttendeesByEventId',
                functionParams: [
                    {
                        paramName: 'eventId',
                        paramValue: eventId,
                        paramType: typeof eventId,
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
//# sourceMappingURL=getAllAttendeesByEventId.js.map