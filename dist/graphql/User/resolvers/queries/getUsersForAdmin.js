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
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getUsersForAdmin(parent, { userSearchParams, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const user = yield User.findById(decodedToken.UserId, 'accountDetails.accountType').exec();
            const { keywords, isIndividual, isAffiliate, pageNumber, resultsPerPage } = userSearchParams;
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getUsersForAdmin',
                functionParams: [
                    {
                        paramName: 'userSearchParams',
                        paramValue: userSearchParams,
                        paramType: typeof userSearchParams,
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
            if (user.accountDetails.accountType !== 'admin') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getUsersForAdmin',
                    functionParams: [
                        {
                            paramName: 'userSearchParams',
                            paramValue: userSearchParams,
                            paramType: typeof userSearchParams,
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
                    additionalMessage: 'Invalid Permissions: Missing Admin Permissions',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            let baseQuery = {};
            if (keywords) {
                let keywordsQuery = [];
                const safeKeywords = escapeStringRegexp(keywords);
                const regex = new RegExp(safeKeywords, 'i');
                keywordsQuery.push({ 'accountDetails.username': { $regex: regex } });
                keywordsQuery.push({ 'accountDetails.email': { $regex: regex } });
                keywordsQuery.push({ 'locationDetails.country': { $regex: regex } });
                keywordsQuery.push({ 'locationDetails.zipCode': { $regex: regex } });
                keywordsQuery.push({ 'personalDetails.searchTags': { $regex: regex } });
                baseQuery['$or'] = keywordsQuery;
            }
            if (isIndividual) {
                baseQuery['accountDetails.isIndividual'] = isIndividual;
            }
            if (isAffiliate) {
                baseQuery['isMarketer'] = true;
            }
            const users = yield User.find(baseQuery)
                .skip(pageNumber * resultsPerPage - resultsPerPage)
                .limit(resultsPerPage)
                .exec();
            const userCount = yield User.count(baseQuery).exec();
            if (users.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getUsersForAdmin',
                    functionParams: [
                        {
                            paramName: 'userSearchParams',
                            paramValue: userSearchParams,
                            paramType: typeof userSearchParams,
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
                    additionalMessage: 'No Users Found',
                    startLogId,
                });
                return {
                    userData: users,
                    userCount,
                    response: {
                        message: 'No Users Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getUsersForAdmin',
                functionParams: [
                    {
                        paramName: 'userSearchParams',
                        paramValue: userSearchParams,
                        paramType: typeof userSearchParams,
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
                userData: users,
                userCount,
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
                    functionName: 'getUsersForAdmin',
                    functionParams: [
                        {
                            paramName: 'userSearchParams',
                            paramValue: userSearchParams,
                            paramType: typeof userSearchParams,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: JWT Token Invalid',
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
                functionName: 'getUsersForAdmin',
                functionParams: [
                    {
                        paramName: 'userSearchParams',
                        paramValue: userSearchParams,
                        paramType: typeof userSearchParams,
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
//# sourceMappingURL=getUsersForAdmin.js.map