var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import PendingPayout from '../../../../MongoModels/PendingPayout';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import dayjs from 'dayjs';
import objectSupport from 'dayjs/plugin/objectSupport';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { EscrowReleaseStatus } from '../../../../constants/enums';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(objectSupport);
export default function getPendingPayouts(_, { searchParams, token }) {
    return __awaiter(this, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const { pageNumber, resultsPerPage, showReleased } = searchParams;
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getPendingPayouts',
                functionParams: [
                    {
                        paramName: 'searchParams',
                        paramValue: searchParams,
                        paramType: typeof searchParams,
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
            const payouts = yield PendingPayout.find({
                status: showReleased ? EscrowReleaseStatus.RELEASED : EscrowReleaseStatus.UNRELEASED,
            })
                .sort({ startTime: 1 })
                .skip(pageNumber * resultsPerPage - resultsPerPage)
                .limit(resultsPerPage)
                .exec();
            const payoutCount = yield PendingPayout.count({
                status: showReleased ? EscrowReleaseStatus.RELEASED : EscrowReleaseStatus.UNRELEASED,
            });
            if (payouts.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getPendingPayouts',
                    functionParams: [
                        {
                            paramName: 'searchParams',
                            paramValue: searchParams,
                            paramType: typeof searchParams,
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
                    additionalMessage: 'Document Not Found',
                    startLogId,
                });
                return {
                    payoutData: payouts,
                    payoutCount: payoutCount,
                    response: {
                        message: 'Document Not Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getPendingPayouts',
                functionParams: [
                    {
                        paramName: 'searchParams',
                        paramValue: searchParams,
                        paramType: typeof searchParams,
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
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                payoutData: payouts,
                payoutCount: payoutCount,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getPendingPayouts',
                    functionParams: [
                        {
                            paramName: 'searchParams',
                            paramValue: searchParams,
                            paramType: typeof searchParams,
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
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getPendingPayouts',
                functionParams: [
                    {
                        paramName: 'searchParams',
                        paramValue: searchParams,
                        paramType: typeof searchParams,
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
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=getPendingPayouts.js.map