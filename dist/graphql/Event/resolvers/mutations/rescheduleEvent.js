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
import { EVENT_RECURRING_TYPES, EVENT_STATUS_TYPES } from '../../../../constants/enums';
import dayjs from 'dayjs';
import Attendee from '../../../../MongoModels/Attendee';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import agenda from '../../../../lib/agenda';
export default function rescheduleEvent(parent, { documentId, token, newEventDateTime }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'rescheduleEvent',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'newEventDateTime',
                        paramValue: newEventDateTime,
                        paramType: typeof newEventDateTime,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            let event = yield Event.findOne({
                userId: decodedToken.UserId,
                _id: documentId,
            });
            if (!event) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editService',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'newEventDateTime',
                            paramValue: newEventDateTime,
                            paramType: typeof newEventDateTime,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Document Not Found',
                    startLogId,
                });
                return {
                    message: 'Document Not Found',
                    status: 404,
                };
            }
            if (event.eventStatus !== EVENT_STATUS_TYPES.CONCLUDED) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editService',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'newEventDateTime',
                            paramValue: newEventDateTime,
                            paramType: typeof newEventDateTime,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Event not concluded yet',
                    startLogId,
                });
                return {
                    message: 'Event not concluded yet',
                    status: 400,
                };
            }
            if (event.serviceRecurring !== EVENT_RECURRING_TYPES.NOT_RECURRING) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editService',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'newEventDateTime',
                            paramValue: newEventDateTime,
                            paramType: typeof newEventDateTime,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Invalid request',
                    startLogId,
                });
                return {
                    message: 'Invalid request',
                    status: 400,
                };
            }
            event.eventStatus = EVENT_STATUS_TYPES.UPCOMING;
            event.serviceDateTime = newEventDateTime;
            yield event.save();
            event = yield Event.findOne({
                userId: decodedToken.UserId,
                _id: documentId,
            });
            const eventUpdatesEmailPayload = {
                emailText: 'Event has been rescheduled by organizer',
                eventTitle: event.serviceTitle,
                eventDateTime: dayjs(event.serviceDateTime).format('ddd, MMM DD, YYYY - hh:mma'),
                eventDescription: event.serviceDescription,
            };
            const attendees = yield Attendee.find({ eventId: event._id }).populate('attendeeId');
            attendees.forEach((attendee) => __awaiter(this, void 0, void 0, function* () {
                yield sendEmail(eventUpdatesEmailPayload, attendee.attendeeId.accountDetails.email, TEMPLATES.EVENT.EMAIL_UPDATES);
            }));
            const agendaInstance = yield agenda.getInstance();
            const scheduledTime = dayjs(event.serviceDateTime)
                .add(event.serviceDuration, 'minute')
                .toDate();
            yield agendaInstance.schedule(scheduledTime, 'autoConcludeEvent', {
                eventId: event._id,
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'rescheduleEvent',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'newEventDateTime',
                        paramValue: newEventDateTime,
                        paramType: typeof newEventDateTime,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Event Rescheduled Successfully',
                startLogId,
            });
            return {
                message: 'Event Rescheduled Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'rescheduleEvent',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'newEventDateTime',
                            paramValue: newEventDateTime,
                            paramType: typeof newEventDateTime,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Event validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'rescheduleEvent',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'newEventDateTime',
                            paramValue: newEventDateTime,
                            paramType: typeof newEventDateTime,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Mongoose Event Validation Failed',
                    startLogId,
                });
                return {
                    message: err.message,
                    status: 400,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'rescheduleEvent',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
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
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=rescheduleEvent.js.map