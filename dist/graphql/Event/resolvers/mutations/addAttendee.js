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
import { ATTENDEE_STATUS_TYPES } from '../../../../constants/enums';
import Attendee from '../../../../MongoModels/Attendee';
import Event from '../../../../MongoModels/Event';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import agenda from '../../../../lib/agenda';
export default function addAttendee(parent, { attendeeData }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'addAttendee',
                functionParams: [
                    {
                        paramName: 'attendeeData',
                        paramValue: attendeeData,
                        paramType: typeof attendeeData,
                    },
                ],
            });
            const { attendeeId, eventId, attendingDateTime, answeredQuestions } = attendeeData;
            const existingAttendee = yield Attendee.findOne({
                attendeeId,
                eventId,
                attendeeStatus: ATTENDEE_STATUS_TYPES.REGISTERED,
                attendingDateTime,
            });
            if (existingAttendee) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addAttendee',
                    functionParams: [
                        {
                            paramName: 'attendeeData',
                            paramValue: attendeeData,
                            paramType: typeof attendeeData,
                        },
                    ],
                    additionalMessage: 'Already registered for this event',
                    startLogId,
                });
                return {
                    message: 'Already registered for this event',
                    status: 400,
                };
            }
            const event = yield Event.findById(eventId);
            if (!event) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editService',
                    functionParams: [
                        {
                            paramName: 'attendeeData',
                            paramValue: attendeeData,
                            paramType: typeof attendeeData,
                        },
                    ],
                    additionalMessage: 'Event Not Found',
                    startLogId,
                });
                return {
                    message: 'Event Not Found',
                    status: 404,
                };
            }
            const newLimit = event.serviceAttendeeCount + 1;
            if (newLimit > event.serviceAttendeeLimit) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addAttendee',
                    functionParams: [
                        {
                            paramName: 'attendeeData',
                            paramValue: attendeeData,
                            paramType: typeof attendeeData,
                        },
                    ],
                    additionalMessage: 'Event maximum attendee limit exceeded',
                    startLogId,
                });
                return {
                    message: 'Event maximum attendee limit exceeded',
                    status: 400,
                };
            }
            const createdAttendee = yield Attendee.create({
                attendeeId,
                eventId,
                answeredQuestions,
                attendingDateTime,
                registeredDateTime: dayjs.utc().format(),
            });
            const organizer = yield User.findById(event.userId);
            const attendee = yield User.findById(attendeeId);
            const organizerEmailPayload = {
                emailText: `${attendee.personalDetails.name} has registered for your event: ${event.serviceTitle}`,
                attendeeName: attendee.personalDetails.name,
                attendeeEmail: attendee.accountDetails.email,
                registeredDateTime: dayjs(createdAttendee.registeredDateTime).format('ddd, MMM DD, YYYY - hh:mma'),
                attendingDateTime: dayjs(createdAttendee.attendingDateTime).format('ddd, MMM DD, YYYY - hh:mma'),
                eventTitle: event.serviceTitle,
                eventDescription: event.serviceDescription,
                eventSlug: event.serviceSlug,
                organizerUsername: organizer.accountDetails.username,
            };
            yield sendEmail(organizerEmailPayload, organizer.accountDetails.email, TEMPLATES.EVENT.EMAIL_TO_ORGANIZER);
            const attendeeEmailPayload = {
                eventAttendeesMessage: event.serviceAttendeesMessage,
                eventTitle: event.serviceTitle,
                eventDateTime: dayjs(createdAttendee.attendingDateTime).format('ddd, MMM DD, YYYY - hh:mma'),
                eventDescription: event.serviceDescription,
                eventSlug: event.serviceSlug,
                organizerUsername: organizer.accountDetails.username,
            };
            yield sendEmail(attendeeEmailPayload, attendee.accountDetails.email, TEMPLATES.EVENT.EMAIL_TO_ATTENDEE);
            const agendaInstance = yield agenda.getInstance();
            if (dayjs(attendingDateTime).diff(dayjs(), 'hour') >= 24) {
                const reminder24HrTime = dayjs(attendingDateTime).subtract(1, 'day').toDate();
                yield agendaInstance.schedule(reminder24HrTime, 'send24HrEventReminder', {
                    eventId,
                    attendeeDocumentId: createdAttendee._id,
                    attendingDateTime,
                });
            }
            if (dayjs(attendingDateTime).diff(dayjs(), 'minute') >= 15) {
                const reminder15minTime = dayjs(attendingDateTime).subtract(15, 'minute').toDate();
                yield agendaInstance.schedule(reminder15minTime, 'send15MinEventReminder', {
                    eventId,
                    attendeeDocumentId: createdAttendee._id,
                    attendingDateTime,
                });
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'addAttendee',
                functionParams: [
                    {
                        paramName: 'attendeeData',
                        paramValue: attendeeData,
                        paramType: typeof attendeeData,
                    },
                ],
                additionalMessage: 'Request for attending event was successfull',
                startLogId,
            });
            return {
                message: 'Request for attending event was successfull',
                status: 200,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Attendee validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addAttendee',
                    functionParams: [
                        {
                            paramName: 'attendeeData',
                            paramValue: attendeeData,
                            paramType: typeof attendeeData,
                        },
                    ],
                    additionalMessage: 'Mongoose Attendee Validation Failed',
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
                functionName: 'addAttendee',
                functionParams: [
                    {
                        paramName: 'attendeeData',
                        paramValue: attendeeData,
                        paramType: typeof attendeeData,
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
//# sourceMappingURL=addAttendee.js.map