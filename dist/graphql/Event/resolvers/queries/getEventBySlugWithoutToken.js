var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable no-await-in-loop */
import dayjs from 'dayjs';
import { ATTENDEE_STATUS_TYPES, EVENT_RECURRING_TYPES, EVENT_STATUS_TYPES, } from '../../../../constants/enums';
import Attendee from '../../../../MongoModels/Attendee';
import Event from '../../../../MongoModels/Event';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getEventBySlugWithoutToken(parent, { slug }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getEventBySlugWithoutToken',
                functionParams: [
                    {
                        paramName: 'slug',
                        paramValue: slug,
                        paramType: typeof slug,
                    },
                ],
            });
            const event = yield Event.findOne({
                serviceSlug: slug,
                eventStatus: { $ne: EVENT_STATUS_TYPES.CANCELLED },
            }).populate('userId');
            if (!event) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getEventBySlugWithoutToken',
                    functionParams: [
                        {
                            paramName: 'slug',
                            paramValue: slug,
                            paramType: typeof slug,
                        },
                    ],
                    additionalMessage: 'Document Not Found',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Document Not Found',
                        status: 404,
                    },
                };
            }
            let eventUpcomingDates = [];
            if (event.serviceRecurring !== EVENT_RECURRING_TYPES.NOT_RECURRING) {
                const recurrentType = event.serviceRecurring;
                const interval = recurrentType === EVENT_RECURRING_TYPES.WEEKLY ? 'week' : 'month';
                let eventDateTime = dayjs(event.serviceDateTime);
                const todayDateTime = dayjs();
                let eventPushedCounts = 0;
                while (eventPushedCounts < 4) {
                    if (eventDateTime.isSameOrAfter(todayDateTime)) {
                        eventUpcomingDates.push({
                            eventDateTime: eventDateTime.utc().format(),
                            attendeeCount: 0,
                            isAttending: false,
                        });
                        eventPushedCounts += 1;
                    }
                    eventDateTime = dayjs(eventDateTime).add(1, interval);
                }
                for (let index = 0; index < eventUpcomingDates.length; index++) {
                    const eventDateObj = eventUpcomingDates[index];
                    const attendees = yield Attendee.find({
                        eventId: event._id,
                        attendingDateTime: eventDateObj.eventDateTime,
                        attendeeStatus: ATTENDEE_STATUS_TYPES.REGISTERED,
                    });
                    eventUpcomingDates[index].attendeeCount = attendees.length;
                }
            }
            else {
                const eventDateTime = dayjs(event.serviceDateTime);
                const attendees = yield Attendee.find({
                    eventId: event._id,
                    attendeeStatus: ATTENDEE_STATUS_TYPES.REGISTERED,
                });
                eventUpcomingDates.push({
                    eventDateTime: eventDateTime.utc().format(),
                    attendeeCount: attendees.length,
                    isAttending: false,
                });
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getEventBySlugWithoutToken',
                functionParams: [
                    {
                        paramName: 'slug',
                        paramValue: slug,
                        paramType: typeof slug,
                    },
                ],
                additionalMessage: 'Event Query Successful',
                startLogId,
            });
            return {
                eventData: event,
                eventUpcomingDates,
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
                functionName: 'getEventBySlugWithoutToken',
                functionParams: [
                    {
                        paramName: 'slug',
                        paramValue: slug,
                        paramType: typeof slug,
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
//# sourceMappingURL=getEventBySlugWithoutToken.js.map