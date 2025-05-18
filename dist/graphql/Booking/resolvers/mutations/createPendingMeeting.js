var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { languageCode } from '../../../../utils/languageCode';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import User from '../../../../MongoModels/User';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import generateUsername from '../../../../utils/generateUsername';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Service from '../../../../MongoModels/Service';
import { BW_LIST, SERVICE_TYPES } from '../../../../constants/enums';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import getBusyTimes from '../../../../utils/busyTimes/getBusyTimes';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
export default function createPendingMeeting(parent, { bookingData }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingMeeting',
                    functionParams: [
                        {
                            paramName: 'bookingData',
                            paramValue: bookingData,
                            paramType: typeof bookingData,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createPendingMeeting',
                functionParams: [
                    {
                        paramName: 'bookingData',
                        paramValue: bookingData,
                        paramType: typeof bookingData,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
                    },
                ],
            });
            const { captchaToken, providerUsername, dateBooked, bookerName, bookerEmail, bookerLanguage, providerName, providerEmail, bookerPhone, bookerTimeZone, ccRecipients, additionalNotes, meetingCount, price, currency, paymentAccount, paymentType, paymentStatus, chargeID, meetingDate, percentDonated, charity, title, subject, conferenceType, startTime, endTime, meetingDuration, reminders, status, serviceID, serviceType, answeredQuestions, } = bookingData;
            const safeProviderUsername = escapeStringRegexp(providerUsername);
            const usernamePattern = `^${safeProviderUsername}$`;
            const providerRegex = new RegExp(usernamePattern, 'i');
            const providerUser = yield User.findOne({
                'accountDetails.username': { $regex: providerRegex },
            }, [
                '_id',
                'locationDetails.timezone',
                'accountDetails.activeExtensions',
                'personalDetails.language',
            ]).exec();
            if (!providerUser) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingMeeting',
                    functionParams: [
                        {
                            paramName: 'bookingData',
                            paramValue: bookingData,
                            paramType: typeof bookingData,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
                        },
                    ],
                    additionalMessage: 'Provider Not Found',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Provider Not Found',
                        status: 404,
                    },
                };
            }
            const serviceEmailFilter = yield Service.findOne({
                _id: serviceID,
            }, ['emailFilter', 'serviceType']).exec();
            if ([SERVICE_TYPES.ROUND_ROBIN, SERVICE_TYPES.MEETING].includes(serviceEmailFilter.serviceType)) {
                const availabilities = yield getBusyTimes([{ _id: providerUser._id }], bookingData.startTime, bookingData.endTime);
                let isNotAvailable = false;
                availabilities.forEach(bookingTime => {
                    if (dayjs(bookingData.startTime).isBetween(dayjs(bookingTime.start), dayjs(bookingTime.end), null, '[]') ||
                        dayjs(bookingData.endTime).isBetween(dayjs(bookingTime.start), dayjs(bookingTime.end), null, '[]')) {
                        isNotAvailable = true;
                    }
                });
                if (isNotAvailable) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'createPendingBooking',
                        functionParams: [
                            {
                                paramName: 'bookingData',
                                paramValue: bookingData,
                                paramType: typeof bookingData,
                            },
                            {
                                paramName: 'token',
                                paramValue: 'HIDDEN_TOKEN',
                                paramType: typeof context.token,
                            },
                        ],
                        additionalMessage: 'The Slot Is Already Booked!',
                        startLogId,
                    });
                    return {
                        response: {
                            message: 'The Slot Is Already Booked!',
                            status: 404,
                        },
                    };
                }
            }
            const safeEmail = escapeStringRegexp(bookerEmail);
            const emailPattern = `^${safeEmail}$`;
            const emailRegex = new RegExp(emailPattern, 'i');
            let bookerUser = yield User.findOne({ 'accountDetails.email': { $regex: emailRegex } }).exec();
            // Booker does not have account, create a new one for them
            if (!bookerUser) {
                const username = yield generateUsername(bookerName, Math.floor(1000 + Math.random() * 9000));
                bookerUser = yield User.create({
                    'accountDetails.username': username,
                    'accountDetails.email': bookerEmail,
                    'accountDetails.verifiedEmail': false,
                    'personalDetails.name': bookerName,
                });
                const emailPayload = {
                    clientName: bookerName,
                    [languageCode(bookerLanguage)]: true,
                };
                yield sendEmail(emailPayload, bookerEmail, TEMPLATES.BOOKING.CLIENT_ACCOUNT_CREATED);
            }
            const hasExtension = yield ActiveExtension.exists({
                userId: providerUser._id,
                extensionProductId: stripeProductIDs.EXTENSIONS.BLACK_WHITE_LIST,
                status: {
                    $in: ['paid', 'gifted'],
                },
            });
            if (hasExtension) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'createPendingMeeting',
                    functionParams: [
                        {
                            paramName: 'bookingData',
                            paramValue: bookingData,
                            paramType: typeof bookingData,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
                        },
                    ],
                    additionalMessage: 'Provider has BLACK_WHITE_LIST Extension',
                    startLogId,
                });
                const bookingCount = yield BookedMeeting.count({
                    serviceId: serviceID,
                    startTime,
                    endTime,
                    'status.clientCanceled': false,
                    'status.providerCanceled': false,
                    'status.providerDeclined': false,
                    'status.hasOpenReport': false,
                });
                if (bookingCount >= serviceEmailFilter.attendeeLimit &&
                    [SERVICE_TYPES.MEETING, SERVICE_TYPES.ROUND_ROBIN].includes(serviceEmailFilter === null || serviceEmailFilter === void 0 ? void 0 : serviceEmailFilter.serviceType)) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'createPendingMeeting',
                        functionParams: [
                            {
                                paramName: 'bookingData',
                                paramValue: bookingData,
                                paramType: typeof bookingData,
                            },
                            {
                                paramName: 'token',
                                paramValue: 'HIDDEN_TOKEN',
                                paramType: typeof context.token,
                            },
                        ],
                        additionalMessage: 'Slots Booked!, Booker all slots are booked!',
                        startLogId,
                    });
                    return {
                        response: {
                            message: 'Slots Booked!, Booker all slots are booked!',
                            status: 401,
                        },
                    };
                }
                if (serviceEmailFilter === null || serviceEmailFilter === void 0 ? void 0 : serviceEmailFilter.emailFilter) {
                    const emailFiltered = serviceEmailFilter.emailFilter.emails.includes(bookerEmail);
                    const domainFiltered = serviceEmailFilter.emailFilter.domains.some(val => bookerEmail.split('@').includes(val));
                    if (serviceEmailFilter.emailFilter.type === BW_LIST.BLACK_LIST &&
                        (emailFiltered || domainFiltered)) {
                        yield createApiLog({
                            type: ApiLogTypes.MUTATION_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'createPendingMeeting',
                            functionParams: [
                                {
                                    paramName: 'bookingData',
                                    paramValue: bookingData,
                                    paramType: typeof bookingData,
                                },
                                {
                                    paramName: 'token',
                                    paramValue: 'HIDDEN_TOKEN',
                                    paramType: typeof context.token,
                                },
                            ],
                            additionalMessage: `This ${emailFiltered ? 'email' : 'domain'} is Blocked by the Provider user.`,
                            startLogId,
                        });
                        return {
                            response: {
                                message: `This ${emailFiltered ? 'email' : 'domain'} is Blocked by the Provider user.`,
                                status: 401,
                            },
                        };
                    }
                    if (serviceEmailFilter.emailFilter.type === BW_LIST.WHITE_LIST &&
                        !emailFiltered &&
                        !domainFiltered) {
                        yield createApiLog({
                            type: ApiLogTypes.MUTATION_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'createPendingMeeting',
                            functionParams: [
                                {
                                    paramName: 'bookingData',
                                    paramValue: bookingData,
                                    paramType: typeof bookingData,
                                },
                                {
                                    paramName: 'token',
                                    paramValue: 'HIDDEN_TOKEN',
                                    paramType: typeof context.token,
                                },
                            ],
                            additionalMessage: `This ${!emailFiltered ? 'email' : 'domain'} is not in the whitelist.`,
                            startLogId,
                        });
                        return {
                            response: {
                                message: `This ${!emailFiltered ? 'email' : 'domain'} is not in the whitelist.`,
                                status: 401,
                            },
                        };
                    }
                }
            }
            const createdBookedMeeting = yield BookedMeeting.create({
                captchaToken: captchaToken,
                provider: providerUser._id,
                booker: bookerUser._id,
                dateBooked,
                bookerName,
                bookerEmail,
                providerName,
                providerEmail,
                bookerPhone,
                bookerTimeZone,
                ccRecipients,
                additionalNotes,
                meetingCount,
                price,
                currency,
                paymentAccount,
                paymentType,
                paymentStatus,
                chargeID,
                meetingDate,
                percentDonated,
                charity,
                title,
                subject,
                conferenceType,
                startTime,
                endTime,
                meetingDuration,
                reminders,
                'status.clientConfirmed': status === null || status === void 0 ? void 0 : status.clientConfirmed,
                'status.clientCanceled': status === null || status === void 0 ? void 0 : status.clientCanceled,
                'status.providerConfirmed': status === null || status === void 0 ? void 0 : status.providerConfirmed,
                'status.providerCanceled': status === null || status === void 0 ? void 0 : status.providerCanceled,
                'status.providerDeclined': status === null || status === void 0 ? void 0 : status.providerDeclined,
                'status.refundRequested': status === null || status === void 0 ? void 0 : status.refundRequested,
                'status.refunded': status === null || status === void 0 ? void 0 : status.refunded,
                'status.hasOpenReport': status === null || status === void 0 ? void 0 : status.hasOpenReport,
                'status.reportReason': status === null || status === void 0 ? void 0 : status.reportReason,
                'status.postMeetingNotes': status === null || status === void 0 ? void 0 : status.postMeetingNotes,
                'status.postMeetingFeedback': status === null || status === void 0 ? void 0 : status.postMeetingFeedback,
                serviceID,
                serviceType,
                answeredQuestions,
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createPendingMeeting',
                functionParams: [
                    {
                        paramName: 'bookingData',
                        paramValue: bookingData,
                        paramType: typeof bookingData,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
                    },
                ],
                additionalMessage: 'Meeting Booked Successfully',
                startLogId,
            });
            return {
                response: {
                    message: 'Meeting Booked Successfully',
                    status: 200,
                },
                bookingId: createdBookedMeeting._id,
                providerLanguage: providerUser.personalDetails.language,
                bookerLanguage: bookerUser.personalDetails.language,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'BookedMeeting validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingMeeting',
                    functionParams: [
                        {
                            paramName: 'bookingData',
                            paramValue: bookingData,
                            paramType: typeof bookingData,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
                        },
                    ],
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
                functionName: 'createPendingMeeting',
                functionParams: [
                    {
                        paramName: 'bookingData',
                        paramValue: bookingData,
                        paramType: typeof bookingData,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
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
//# sourceMappingURL=createPendingMeeting.js.map