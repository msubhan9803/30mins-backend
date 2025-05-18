var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Event from '../MongoModels/Event';
import { EVENT_STATUS_TYPES } from '../constants/enums';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
export default function autoConcludeEvent(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        let eventIdVal;
        try {
            agenda.define('autoConcludeEvent', (job, done) => __awaiter(this, void 0, void 0, function* () {
                console.log('autoConcludeEvent job started ...');
                eventIdVal = job.attrs.data.eventId;
                const { eventId } = job.attrs.data;
                try {
                    yield createApiLog({
                        type: ApiLogTypes.API_PROCESSING_START,
                        level: ApiLogLevels.INFO,
                        functionName: 'autoConcludeEvent',
                        functionParams: [
                            {
                                paramName: 'eventId',
                                paramValue: eventId,
                                paramType: typeof eventId,
                            },
                        ],
                        additionalMessage: JSON.stringify(job.attrs.data),
                        startLogId: `EVENT_ID ${eventId}`,
                    });
                    const event = yield Event.findById(eventId);
                    event.eventStatus = EVENT_STATUS_TYPES.CONCLUDED;
                    yield event.save();
                    yield job.remove();
                    done();
                }
                catch (err) {
                    yield createApiLog({
                        type: ApiLogTypes.API_PROCESSING_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'autoConcludeEvent',
                        functionParams: [
                            {
                                paramName: 'eventId',
                                paramValue: eventId,
                                paramType: typeof eventId,
                            },
                        ],
                        additionalMessage: err.message,
                        startLogId: `EVENT_ID ${eventId}`,
                    });
                }
            }));
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.API_PROCESSING_END,
                level: ApiLogLevels.ERROR,
                functionName: 'autoConcludeEvent',
                functionParams: [],
                additionalMessage: err.message,
                startLogId: `EVENT_ID ${eventIdVal}`,
            });
            throw err;
        }
    });
}
//# sourceMappingURL=autoConcludeEvent.js.map