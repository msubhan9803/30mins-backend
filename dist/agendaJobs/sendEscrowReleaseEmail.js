var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import User from '../MongoModels/User';
import AwsSecrets from '../utils/getAwsSecrets';
import Stripe from 'stripe';
import BookedMeeting from '../MongoModels/BookedMeeting';
import { ESCROW_PAYMENT_OPTIONS, EscrowReleaseStatus } from '../constants/enums';
import PendingPayout from '../MongoModels/PendingPayout';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
export default function sendEscrowReleaseEmail(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        let catchEmailData;
        let catchPaymentAccount;
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            agenda.define('sendEscrowReleaseEmail', (job, done) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f;
                const { emailData, paymentAccount, providerId } = job.attrs.data;
                catchEmailData = emailData;
                catchPaymentAccount = paymentAccount;
                startLogId = yield createApiLog({
                    type: ApiLogTypes.API_PROCESSING_START,
                    level: ApiLogLevels.INFO,
                    functionName: 'sendEscrowReleaseEmail',
                    functionParams: [
                        {
                            paramName: 'emailData',
                            paramValue: emailData,
                            paramType: typeof emailData,
                        },
                        {
                            paramName: 'paymentAccount',
                            paramValue: paymentAccount,
                            paramType: typeof paymentAccount,
                        },
                    ],
                    additionalMessage: 'Escrow Release Start',
                });
                const provider = yield User.findById(providerId);
                const providerPayoutType = (_b = (_a = provider === null || provider === void 0 ? void 0 : provider.accountDetails) === null || _a === void 0 ? void 0 : _a.paymentAccounts) === null || _b === void 0 ? void 0 : _b.escrow[0];
                const providerPayoutId = provider === null || provider === void 0 ? void 0 : provider.accountDetails[providerPayoutType];
                if (providerPayoutType === ESCROW_PAYMENT_OPTIONS.STRIPE) {
                    const stripe = new Stripe(SECRETS.STRIPE_SERVER_ID_TEST, {
                        apiVersion: '2020-08-27',
                    });
                    const transfer = yield stripe.transfers.create({
                        amount: Math.ceil(emailData.amountToRelease * 100),
                        currency: 'USD',
                        destination: (_c = provider === null || provider === void 0 ? void 0 : provider.accountDetails) === null || _c === void 0 ? void 0 : _c.stripeAccountId,
                    });
                    yield BookedMeeting.findByIdAndUpdate(emailData.bookingId, {
                        $set: {
                            'status.paymentReleased': true,
                        },
                    });
                    yield sendEmail(Object.assign({ transferId: transfer.id }, emailData), SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.RELEASE_ESCROW_TO_30MIN);
                    yield sendEmail(emailData, provider.accountDetails.email, TEMPLATES.POST_BOOKING.PAYMENT_RELEASED);
                    yield PendingPayout.create({
                        providerEmail: (_d = provider === null || provider === void 0 ? void 0 : provider.accountDetails) === null || _d === void 0 ? void 0 : _d.email,
                        providerPayoutMethod: {
                            payoutType: 'Stripe',
                            payoutId: (_e = provider === null || provider === void 0 ? void 0 : provider.accountDetails) === null || _e === void 0 ? void 0 : _e.stripeAccountId,
                        },
                        bookerEmail: emailData === null || emailData === void 0 ? void 0 : emailData.clientEmail,
                        amountToRelease: emailData === null || emailData === void 0 ? void 0 : emailData.amountToRelease,
                        bookingId: emailData.bookingId,
                        status: EscrowReleaseStatus.RELEASED,
                        dateReleased: Date.now(),
                    });
                }
                else {
                    yield PendingPayout.create({
                        providerEmail: (_f = provider === null || provider === void 0 ? void 0 : provider.accountDetails) === null || _f === void 0 ? void 0 : _f.email,
                        providerPayoutMethod: {
                            payoutType: providerPayoutType,
                            payoutId: providerPayoutId,
                        },
                        bookerEmail: emailData === null || emailData === void 0 ? void 0 : emailData.clientEmail,
                        amountToRelease: emailData === null || emailData === void 0 ? void 0 : emailData.amountToRelease,
                        bookingId: emailData === null || emailData === void 0 ? void 0 : emailData.bookingId,
                        status: EscrowReleaseStatus.UNRELEASED,
                    });
                }
                yield sendEmail(Object.assign({}, emailData), SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.RELEASE_ESCROW_TO_30MIN);
                yield createApiLog({
                    type: ApiLogTypes.API_PROCESSING_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'sendEscrowReleaseEmail',
                    functionParams: [
                        {
                            paramName: 'emailData',
                            paramValue: emailData,
                            paramType: typeof emailData,
                        },
                        {
                            paramName: 'paymentAccount',
                            paramValue: paymentAccount,
                            paramType: typeof paymentAccount,
                        },
                    ],
                    additionalMessage: 'Escrow Release End',
                    startLogId,
                });
                yield job.remove();
                done();
            }));
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.API_PROCESSING_END,
                level: ApiLogLevels.INFO,
                functionName: 'sendEscrowReleaseEmail',
                functionParams: [
                    {
                        paramName: 'catchEmailData',
                        paramValue: catchEmailData,
                        paramType: typeof catchEmailData,
                    },
                    {
                        paramName: 'catchPaymentAccount',
                        paramValue: catchPaymentAccount,
                        paramType: typeof catchPaymentAccount,
                    },
                ],
                additionalMessage: `Escrow Release Error: ${err === null || err === void 0 ? void 0 : err.message}`,
                startLogId,
            });
            throw err;
        }
    });
}
//# sourceMappingURL=sendEscrowReleaseEmail.js.map