var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import PendingPayout from '../../../../MongoModels/PendingPayout';
import { EscrowReleaseStatus } from '../../../../constants/enums';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
export default function manualEscrowRelease(parent, { documentId }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId = '';
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'manualEscrowRelease',
                functionParams: [
                    {
                        paramName: 'operatorUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                ],
            });
            const isAuthorized = yield User.exists({
                _id: decodedToken.UserId,
                'accountDetails.accountType': { $in: ['admin', 'payoutOperator'] },
            });
            if (!isAuthorized) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'manualEscrowRelease',
                    functionParams: [
                        {
                            paramName: 'operatorUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                    ],
                    additionalMessage: 'Not Authenticated: User Lacks Payout Permissions',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const existingPayout = yield PendingPayout.findByIdAndUpdate(documentId, {
                $set: {
                    status: EscrowReleaseStatus.RELEASED,
                    dateReleased: Date.now(),
                },
            }).orFail(() => new Error('Payout Document Not Found'));
            yield BookedMeeting.findByIdAndUpdate(existingPayout.bookingId, {
                $set: {
                    'status.paymentReleased': true,
                },
            });
            yield sendEmail({
                currency: '$',
                amountToRelease: existingPayout.amountToRelease,
            }, existingPayout.providerEmail, TEMPLATES.POST_BOOKING.PAYMENT_RELEASED);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'manualEscrowRelease',
                functionParams: [
                    {
                        paramName: 'operatorUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                ],
                additionalMessage: 'Payout Updated Successfully',
                startLogId,
            });
            return {
                message: 'Payout Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'manualEscrowRelease',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Payout validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'manualEscrowRelease',
                    functionParams: [
                        {
                            paramName: 'operatorUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                    ],
                    additionalMessage: err.message,
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
                functionName: 'manualEscrowRelease',
                functionParams: [
                    {
                        paramName: 'operatorUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
//# sourceMappingURL=manualEscrowRelease.js.map