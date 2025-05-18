var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Service from '../../../../MongoModels/Service';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import mongoose from 'mongoose';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
export default function getUserDashboardData(parent, { token }) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getUserDashboardData',
                functionParams: [
                    { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const hasPaidService = yield Service.exists({ userId: decodedToken.UserId, isPaid: true });
            const totalRevenueData = yield BookedMeeting.aggregate([
                { $match: { provider: new mongoose.mongo.ObjectId(decodedToken.UserId), price: { $gt: 0 } } },
                { $group: { _id: '$currency', revenue: { $push: '$price' } } },
                {
                    $addFields: {
                        totalRevenue: { $sum: '$revenue' },
                    },
                },
                { $project: { _id: 1, revenue: 0 } },
            ]);
            const orgMemberships = yield OrganizationMembership.find({
                userId: decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.UserId,
            }).populate('organizationId');
            const formattedOrgData = orgMemberships.map(membership => {
                var _a, _b;
                const referralCount = ((_a = membership === null || membership === void 0 ? void 0 : membership.organizationId) === null || _a === void 0 ? void 0 : _a.referralCount) || 0;
                return { organizationTitle: (_b = membership === null || membership === void 0 ? void 0 : membership.organizationId) === null || _b === void 0 ? void 0 : _b.title, count: referralCount };
            });
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getUserDashboardData',
                functionParams: [
                    { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
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
                hasPaidService,
                totalRevenueData,
                orgSignups: formattedOrgData || [],
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
                    functionName: 'getUserDashboardData',
                    functionParams: [{ paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token }],
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
                functionName: 'getUserDashboardData',
                functionParams: [
                    { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
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
//# sourceMappingURL=getUserDashboardData.js.map