var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Event from '../../../../MongoModels/Event';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { EVENT_STATUS_TYPES } from '../../../../constants/enums';
import Attendee from '../../../../MongoModels/Attendee';
import dayjs from 'dayjs';
export default function getEventsForAttendeeOrOrganizer(parent, { searchParams, token }) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const { isOrganizer, pageNumber, resultsPerPage, month, year } = searchParams;
            const startDate = dayjs()
                .set('year', year)
                .set('month', month)
                .startOf('month')
                .startOf('day')
                .utc(true)
                .toISOString();
            const endDate = dayjs()
                .set('month', month)
                .set('year', year)
                .endOf('month')
                .endOf('day')
                .utc(true)
                .toISOString();
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getEventsForAttendeeOrOrganizer',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'isOrganizer',
                        paramValue: isOrganizer,
                        paramType: typeof isOrganizer,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            let events = [];
            let totalRecords = 0;
            if (isOrganizer) {
                events = yield Event.find({
                    userId: decodedToken.UserId,
                    eventStatus: { $ne: EVENT_STATUS_TYPES.CANCELLED },
                    serviceDateTime: { $gt: startDate, $lte: endDate },
                })
                    .populate('userId')
                    .sort({ serviceDateTime: 1 })
                    .skip(pageNumber * resultsPerPage - resultsPerPage)
                    .limit(resultsPerPage);
                const temp = yield Event.find({
                    userId: decodedToken.UserId,
                    eventStatus: { $ne: EVENT_STATUS_TYPES.CANCELLED },
                    serviceDateTime: { $gt: startDate, $lte: endDate },
                });
                totalRecords = temp.length;
            }
            else {
                const attendeeInstances = yield Attendee.find({ attendeeId: decodedToken.UserId }, 'eventId registeredDateTime attendingDateTime');
                const eventIds = attendeeInstances.map(elem => elem.eventId);
                const eventsTemp = yield Event.find({
                    _id: { $in: eventIds },
                    eventStatus: { $ne: EVENT_STATUS_TYPES.CANCELLED },
                    serviceDateTime: { $gt: startDate, $lte: endDate },
                })
                    .populate('userId')
                    .sort({ serviceDateTime: 1 })
                    .skip(pageNumber * resultsPerPage - resultsPerPage)
                    .limit(resultsPerPage);
                const temp = yield Event.find({
                    userId: decodedToken.UserId,
                    eventStatus: { $ne: EVENT_STATUS_TYPES.CANCELLED },
                    serviceDateTime: { $gt: startDate, $lte: endDate },
                });
                totalRecords = temp.length;
                for (let index = 0; index < eventsTemp.length; index++) {
                    const event = {
                        _id: eventsTemp[index]._id,
                        userId: eventsTemp[index].userId,
                        serviceType: eventsTemp[index].serviceType,
                        serviceTitle: eventsTemp[index].serviceTitle,
                        serviceTitleOriginal: eventsTemp[index].serviceTitleOriginal,
                        serviceDuration: eventsTemp[index].serviceDuration,
                        serviceAttendeeLimit: eventsTemp[index].serviceAttendeeLimit,
                        serviceAttendeeCount: eventsTemp[index].serviceAttendeeCount,
                        serviceSlug: eventsTemp[index].serviceSlug,
                        serviceSlugOriginal: eventsTemp[index].serviceSlugOriginal,
                        serviceDateTime: eventsTemp[index].serviceDateTime,
                        serviceRecurring: eventsTemp[index].serviceRecurring,
                        serviceDescription: eventsTemp[index].serviceDescription,
                        isPublic: eventsTemp[index].isPublic,
                        serviceAttendeesMessage: eventsTemp[index].serviceAttendeesMessage,
                        searchTags: eventsTemp[index].searchTags,
                        serviceQuestions: eventsTemp[index].serviceQuestions,
                        serviceQuestionsList: eventsTemp[index].serviceQuestionsList,
                        eventStatus: eventsTemp[index].eventStatus,
                        serviceImage: eventsTemp[index].serviceImage,
                        otpProtected: eventsTemp[index].otpProtected,
                        authenticationType: eventsTemp[index].authenticationType,
                        createdAt: eventsTemp[index].createdAt,
                        updatedAt: eventsTemp[index].updatedAt,
                        attendingDateTime: '',
                        registeredDateTime: '',
                    };
                    const attendee = attendeeInstances.find(elem => elem.eventId.toString() === event._id.toString());
                    event.attendingDateTime = attendee.attendingDateTime;
                    event.registeredDateTime = attendee.registeredDateTime;
                    events.push(event);
                }
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getEventsForAttendeeOrOrganizer',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Event Query Successful',
                startLogId,
            });
            return {
                eventsData: events,
                totalRecords,
                response: {
                    message: 'Event Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getEventsForAttendeeOrOrganizer',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getEventsForAttendeeOrOrganizer',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
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
//# sourceMappingURL=getEventsForAttendeeOrOrganizer.js.map