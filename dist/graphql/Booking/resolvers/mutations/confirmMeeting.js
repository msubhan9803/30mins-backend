var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LANGUAGES, PAYMENT_STATUS } from '../../../../constants/enums';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import { PAYMENT_TYPES } from '../../../../constants/enums';
export default function confirmMeeting(parent, { documentId, chargeID }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        const { token } = context;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'confirmMeeting',
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
                functionName: 'confirmMeeting',
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
                ],
            });
            let booking = yield BookedMeeting.findOneAndUpdate({ _id: documentId, chargeID: { $eq: chargeID } }, {
                $set: {
                    confirmed: true,
                    paymentStatus: PAYMENT_STATUS.PAID,
                },
            }, { returnOriginal: true, lean: true });
            if (!booking) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'confirmMeeting',
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
                    ],
                    additionalMessage: 'Booking Not Found',
                });
                return {
                    response: {
                        message: 'Booking Not Found',
                        status: 404,
                    },
                };
            }
            const providerUser = yield User.findById(booking.provider);
            const serviceData = yield Service.findById(booking.serviceID);
            if (!booking.confirmed) {
                const ccRecipients = booking.ccRecipients.map(function (email) {
                    var _a, _b;
                    return __awaiter(this, void 0, void 0, function* () {
                        return {
                            ccEmail: email,
                            language: ((_b = (_a = booking.bookerUser) === null || _a === void 0 ? void 0 : _a.personalDetails) === null || _b === void 0 ? void 0 : _b.language) || LANGUAGES.ENGLISH,
                        };
                    });
                });
                if (booking.price > 0 && booking.charity && booking.percentDonated) {
                    const donationAmount = booking.price * (booking.percentDonated / 100);
                    yield sendEmail({
                        bookingId: booking._id,
                        providerName: booking.providerName,
                        donationAmount,
                        currency: booking.currency,
                        charity: booking.charity,
                    }, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.CHARITY_ALERT);
                }
            }
            if (!booking.confirmed &&
                !booking.status.paymentReleased &&
                booking.paymentType === PAYMENT_TYPES.DIRECT) {
                yield BookedMeeting.findByIdAndUpdate(documentId, {
                    $set: {
                        'status.paymentReleased': true,
                    },
                });
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'confirmMeeting',
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
                ],
                additionalMessage: 'Booking Confirmed',
                startLogId,
            });
            return {
                bookingData: booking,
                providerUser,
                serviceData,
                response: {
                    message: 'Booking Confirmed',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'confirmMeeting',
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
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=confirmMeeting.js.map