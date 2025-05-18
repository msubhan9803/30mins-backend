var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { clientReportMeeting } from '../../../../utils/booking/meeting/clientReportMeeting';
import { clientRefundMeeting } from '../../../../utils/booking/meeting/clientRefundMeeting';
import { languageCode } from '../../../../utils/languageCode';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import dayjs from 'dayjs';
import agenda from '../../../../lib/agenda';
import jwt from 'jsonwebtoken';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import { LANGUAGES, SERVICE_TYPES } from '../../../../constants/enums';
import { clientCancelMeeting } from '../../../../utils/booking/meeting/clientCancelMeeting';
import { providerCancelMeeting } from '../../../../utils/booking/meeting/providerCancelMeeting';
import { providerDeclineMeeting } from '../../../../utils/booking/meeting/providerDeclineMeeting';
import { clientConfirmMeeting } from '../../../../utils/booking/meeting/clientConfirmMeeting';
import { completeMeeting } from '../../../../utils/booking/meeting/completeMeeting';
import { clientCancelOrder } from '../../../../utils/booking/freelance/clientCancelOrder';
import { requestRefundOrder } from '../../../../utils/booking/freelance/requestRefundOrder';
import { clientConfirmOrder } from '../../../../utils/booking/freelance/clientConfirmOrder';
import { providerCompleteOrder } from '../../../../utils/booking/freelance/providerCompleteOrder';
export default function updateBookingStatus(parent, args, context, info) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        const { statusUpdateData, userId } = args;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            const { token } = context;
            const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
            const SECRETS = yield AwsSecrets.getInstance();
            let decodedToken = {};
            if (token === SECRETS.BACKEND_API_KEY && userId) {
                decodedToken.UserId = userId;
            }
            else {
                decodedToken = jwt.verify(token, accessTokenSecret);
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'updateBookingStatus',
                functionParams: [
                    {
                        paramName: 'statusUpdateData',
                        paramValue: statusUpdateData,
                        paramType: typeof statusUpdateData,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
                    },
                ],
            });
            const { bookingId, clientConfirmed, clientCanceled, providerCanceled, providerDeclined, providerConfirmed, refundRequested, refunded, hasOpenReport, refundRequestReason, reportReason, postMeetingFeedback, postMeetingNotes, paymentStatus, paymentReleased, } = statusUpdateData;
            const bookedMeeting = yield BookedMeeting.findById(bookingId);
            const { bookerName, bookerEmail, providerName, providerEmail, bookerPhone, additionalNotes, meetingCount, price, currency, paymentType, meetingDate, percentDonated, charity, conferenceType, startTime, meetingDuration, status, provider, booker, } = bookedMeeting;
            const agendaInstance = yield agenda.getInstance();
            const isProvider = provider.toString() === decodedToken.UserId;
            if (decodedToken.UserId === provider.toString() || decodedToken.UserId === booker.toString()) {
                const bookerUser = yield User.findOne({
                    'accountDetails.email': bookerEmail,
                }, ['_id', 'personalDetails.language']);
                let TOTAL_FEE = parseFloat(SECRETS.ESCROW_SERVICE_FEE_PERCENT);
                if (percentDonated) {
                    // eslint-disable-next-line radix
                    TOTAL_FEE += parseInt(percentDonated) / 100;
                }
                const ESCROW_AMOUNT_TO_RELEASE = price - price * TOTAL_FEE;
                let EMAIL_DATA = {
                    provider,
                    providerCanceled,
                    providerDeclined,
                    clientCanceled,
                    hasOpenReport,
                    clientName: bookerName,
                    clientEmail: bookerEmail,
                    clientPhone: bookerPhone,
                    clientConfirmed: status.clientConfirmed,
                    providerName,
                    providerEmail,
                    meetingDate: meetingDate ? meetingDate.toString().split('T')[0] : '',
                    meetingTime: `${dayjs(startTime).format('hh:mma')} (UTC)`,
                    meetingDuration,
                    multipleMeetings: meetingCount > 1,
                    paymentType,
                    currency,
                    totalAmount: price,
                    charityName: charity,
                    donationAmount: percentDonated,
                    bookingId,
                    meetingType: conferenceType,
                    postMeetingFeedback: status === null || status === void 0 ? void 0 : status.postMeetingFeedback,
                    postMeetingNotes: status === null || status === void 0 ? void 0 : status.postMeetingNotes,
                    refundRequestReason: status === null || status === void 0 ? void 0 : status.refundRequestReason,
                    reportReason,
                    amountToRelease: ESCROW_AMOUNT_TO_RELEASE,
                    additionalNotes,
                    [languageCode(((_a = bookerUser === null || bookerUser === void 0 ? void 0 : bookerUser.personalDetails) === null || _a === void 0 ? void 0 : _a.language) || LANGUAGES.ENGLISH)]: true,
                };
                if (bookedMeeting.serviceType === SERVICE_TYPES.FREELANCING_WORK) {
                    const dueDateUTC = () => dayjs(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.endTime);
                    const bookedTimeUTC = () => dayjs(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.dateBooked);
                    const isOneHourPassedSinceBooking = dayjs().isAfter(bookedTimeUTC().add(1, 'hour'));
                    const isDueDatePassed = dayjs().isAfter(dueDateUTC());
                    if (providerConfirmed) {
                        const res = providerCompleteOrder(bookedMeeting, statusUpdateData, isProvider, dueDateUTC, agendaInstance, EMAIL_DATA);
                        if (!res) {
                            return {
                                message: 'Cannot confirm meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (clientConfirmed) {
                        const res = clientConfirmOrder(bookedMeeting, statusUpdateData, isProvider, dueDateUTC, agendaInstance, EMAIL_DATA);
                        if (!res) {
                            return {
                                message: 'Cannot confirm Meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (clientCanceled) {
                        const res = clientCancelOrder(bookedMeeting, isProvider, statusUpdateData, isOneHourPassedSinceBooking, isDueDatePassed, agendaInstance, EMAIL_DATA, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.REFUND_REQUEST_TO_30MIN);
                        if (!res) {
                            return {
                                message: 'Cannot confirm Meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (hasOpenReport) {
                        const res = requestRefundOrder(bookedMeeting, statusUpdateData, isProvider, dueDateUTC, agendaInstance, EMAIL_DATA, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.REFUND_REQUEST_TO_30MIN);
                        if (!res) {
                            return {
                                message: 'Cannot report Meeting!',
                                status: 400,
                            };
                        }
                    }
                }
                // Meeting , Round robin
                if (bookedMeeting.serviceType === SERVICE_TYPES.MEETING ||
                    bookedMeeting.serviceType === SERVICE_TYPES.ROUND_ROBIN) {
                    if (providerConfirmed) {
                        const res = completeMeeting(bookedMeeting, statusUpdateData, isProvider, agendaInstance, EMAIL_DATA);
                        if (!res) {
                            return {
                                message: 'Cannot confirm Meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (clientConfirmed) {
                        const res = clientConfirmMeeting(bookedMeeting, statusUpdateData, isProvider, agendaInstance, EMAIL_DATA);
                        if (!res) {
                            return {
                                message: 'Cannot confirm Meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (providerDeclined) {
                        const res = providerDeclineMeeting(bookedMeeting, statusUpdateData, isProvider, agendaInstance, EMAIL_DATA, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.REFUND_REQUEST_TO_30MIN);
                        if (!res) {
                            return {
                                message: 'Cannot Decline Meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (clientCanceled) {
                        const res = clientCancelMeeting(bookedMeeting, statusUpdateData, isProvider, agendaInstance, EMAIL_DATA, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.REFUND_REQUEST_TO_30MIN);
                        if (!res) {
                            return {
                                message: 'Cannot Cancel Meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (providerCanceled) {
                        const res = providerCancelMeeting(bookedMeeting, statusUpdateData, isProvider, agendaInstance, EMAIL_DATA, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.REFUND_REQUEST_TO_30MIN);
                        if (!res) {
                            return {
                                message: 'Cannot Cancel Meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (hasOpenReport && refundRequested) {
                        EMAIL_DATA = Object.assign(Object.assign({}, EMAIL_DATA), { reportReason: refundRequestReason });
                        const res = clientRefundMeeting(bookedMeeting, statusUpdateData, isProvider, agendaInstance, EMAIL_DATA, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.REFUND_REQUEST_TO_30MIN);
                        if (!res) {
                            return {
                                message: 'Cannot refund Meeting!',
                                status: 400,
                            };
                        }
                    }
                    // just report
                    if (hasOpenReport && !refundRequested) {
                        const res = clientReportMeeting(bookedMeeting, statusUpdateData, isProvider, agendaInstance);
                        if (!res) {
                            return {
                                message: 'Cannot report Meeting!',
                                status: 400,
                            };
                        }
                    }
                    if (paymentReleased) {
                        bookedMeeting.paymentReleased = statusUpdateData.paymentReleased;
                    }
                }
                yield bookedMeeting.save();
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'updateBookingStatus',
                    functionParams: [
                        {
                            paramName: 'statusUpdateData',
                            paramValue: statusUpdateData,
                            paramType: typeof statusUpdateData,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
                        },
                    ],
                    additionalMessage: 'Booking Updated Successfully',
                    startLogId,
                });
                return {
                    message: 'Booking Updated Successfully',
                    status: 200,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'updateBookingStatus',
                functionParams: [
                    {
                        paramName: 'statusUpdateData',
                        paramValue: statusUpdateData,
                        paramType: typeof statusUpdateData,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
                    },
                ],
                additionalMessage: 'Not Authenticated',
                startLogId,
            });
            return {
                message: 'Not Authenticated',
                status: 401,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'statusUpdateData',
                    functionParams: [
                        {
                            paramName: 'statusUpdateData',
                            paramValue: statusUpdateData,
                            paramType: typeof statusUpdateData,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'BookedMeeting validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateBookingStatus',
                    functionParams: [
                        {
                            paramName: 'statusUpdateData',
                            paramValue: statusUpdateData,
                            paramType: typeof statusUpdateData,
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
                    message: err.message,
                    status: 400,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'updateBookingStatus',
                functionParams: [
                    {
                        paramName: 'statusUpdateData',
                        paramValue: statusUpdateData,
                        paramType: typeof statusUpdateData,
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
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=updateBookingStatus.js.map