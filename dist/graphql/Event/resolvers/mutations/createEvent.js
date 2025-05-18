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
import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import agenda from '../../../../lib/agenda';
import { EVENT_RECURRING_TYPES } from '../../../../constants/enums';
export default function createEvent(parent, { eventData, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createEvent',
                functionParams: [
                    {
                        paramName: 'createEvent',
                        paramValue: eventData,
                        paramType: typeof eventData,
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
            });
            const { serviceType, serviceTitle, serviceDuration, serviceAttendeeLimit, serviceSlug, serviceDateTime, serviceRecurring, serviceDescription, isPublic, serviceAttendeesMessage, searchTags, serviceQuestions, serviceQuestionsList, eventStatus, serviceImage, serviceMedia, otpProtected, authenticationType, } = eventData;
            const safeSlug = escapeStringRegexp(serviceSlug);
            const pattern = `^${safeSlug}$`;
            const regex = new RegExp(pattern, 'i');
            const dupeSlug = yield Event.exists({
                userId: decodedToken.UserId,
                serviceSlug: { $regex: regex },
            });
            if (dupeSlug) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createEvent',
                    functionParams: [
                        {
                            paramName: 'eventData',
                            paramValue: eventData,
                            paramType: typeof eventData,
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
                    additionalMessage: 'This slug is being used by another service currently.',
                    startLogId,
                });
                return {
                    message: 'This slug is being used by another service currently.',
                    status: 409,
                };
            }
            const createdEvent = yield Event.create({
                userId: decodedToken.UserId,
                serviceType,
                serviceTitle,
                serviceDuration,
                serviceAttendeeLimit,
                serviceSlug,
                serviceDateTime,
                serviceRecurring,
                serviceDescription,
                isPublic,
                serviceAttendeesMessage,
                searchTags,
                serviceQuestions,
                serviceQuestionsList,
                eventStatus,
                serviceImage,
                otpProtected,
                authenticationType,
                'serviceMedia.type': serviceMedia === null || serviceMedia === void 0 ? void 0 : serviceMedia.type,
                'serviceMedia.link': serviceMedia === null || serviceMedia === void 0 ? void 0 : serviceMedia.link,
                serviceTitleOriginal: serviceTitle,
                serviceSlugOriginal: serviceSlug,
            });
            yield User.findByIdAndUpdate(decodedToken.UserId, {
                $push: {
                    events: createdEvent._id,
                },
            })
                .orFail(() => new Error('User Document Not Found'))
                .exec();
            if (serviceRecurring === EVENT_RECURRING_TYPES.NOT_RECURRING) {
                const agendaInstance = yield agenda.getInstance();
                const scheduledTime = dayjs(serviceDateTime).add(serviceDuration, 'minute').toDate();
                yield agendaInstance.schedule(scheduledTime, 'autoConcludeEvent', {
                    eventId: createdEvent._id,
                });
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createEvent',
                functionParams: [
                    {
                        paramName: 'eventData',
                        paramValue: eventData,
                        paramType: typeof eventData,
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
                additionalMessage: 'Service Created Successfully',
                startLogId,
            });
            return {
                message: 'Event Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createEvent',
                    functionParams: [
                        {
                            paramName: 'eventData',
                            paramValue: eventData,
                            paramType: typeof eventData,
                        },
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
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Event validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createEvent',
                    functionParams: [
                        {
                            paramName: 'eventData',
                            paramValue: eventData,
                            paramType: typeof eventData,
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
                functionName: 'createEvent',
                functionParams: [
                    {
                        paramName: 'eventData',
                        paramValue: eventData,
                        paramType: typeof eventData,
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
//# sourceMappingURL=createEvent.js.map