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
import Organization from '../../../../MongoModels/Organization';
export default function getResultsForMarketer(parent, { searchParams }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const { token } = context;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const user = yield User.findById(decodedToken.UserId);
            const { keywords, pageNumber, resultsPerPage, searchType } = searchParams;
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getResultsForMarketer',
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
            if (!(user === null || user === void 0 ? void 0 : user.isMarketer)) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getResultsForMarketer',
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
                    additionalMessage: 'Invalid Permissions: Missing Marketer Permissions',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            let returnData = [];
            let returnDataCount = 0;
            const baseQuery = {
                createdBy: user._id,
                affiliateTeamCreatedBy: '',
                $or: [],
            };
            if (user === null || user === void 0 ? void 0 : user.affiliateTeam) {
                delete baseQuery.createdBy;
                baseQuery.affiliateTeamCreatedBy = user.affiliateTeam;
            }
            else {
                delete baseQuery.affiliateTeamCreatedBy;
            }
            if (searchType === 'USERS') {
                if (keywords) {
                    const keywordsQuery = [];
                    const safeKeywords = escapeStringRegexp(keywords);
                    const regex = new RegExp(safeKeywords, 'i');
                    keywordsQuery.push({ 'accountDetails.username': { $regex: regex } });
                    keywordsQuery.push({ 'accountDetails.email': { $regex: regex } });
                    keywordsQuery.push({ 'locationDetails.country': { $regex: regex } });
                    keywordsQuery.push({ 'locationDetails.zipCode': { $regex: regex } });
                    keywordsQuery.push({ 'personalDetails.searchTags': { $regex: regex } });
                    baseQuery.$or = keywordsQuery;
                }
                if (baseQuery.$or.length === 0) {
                    delete baseQuery.$or;
                }
                returnData = yield User.find(baseQuery)
                    .skip(pageNumber * resultsPerPage - resultsPerPage)
                    .limit(resultsPerPage)
                    .populate('createdBy', ['accountDetails.username']);
                returnDataCount = yield User.count(baseQuery);
            }
            if (searchType === 'ORGANIZATIONS') {
                if (keywords) {
                    const keywordsQuery = [];
                    const safeKeywords = escapeStringRegexp(keywords);
                    const regex = new RegExp(safeKeywords, 'i');
                    keywordsQuery.push({ title: { $regex: regex } });
                    keywordsQuery.push({ slug: { $regex: regex } });
                    baseQuery.$or = keywordsQuery;
                }
                if (baseQuery.$or.length === 0) {
                    delete baseQuery.$or;
                }
                returnData = yield Organization.find(baseQuery)
                    .skip(pageNumber * resultsPerPage - resultsPerPage)
                    .limit(resultsPerPage)
                    .populate('createdBy', ['accountDetails.username']);
                returnDataCount = yield Organization.count(baseQuery);
            }
            if (returnData.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getResultsForMarketer',
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
                    additionalMessage: 'No Results Found',
                    startLogId,
                });
                return {
                    returnData,
                    returnDataCount,
                    response: {
                        message: 'No Results Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getResultsForMarketer',
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
                returnUserData: searchType === 'USERS' ? returnData : [],
                returnOrgData: searchType === 'ORGANIZATIONS' ? returnData : [],
                returnDataCount,
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
                    functionName: 'getResultsForMarketer',
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
                functionName: 'getResultsForMarketer',
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
//# sourceMappingURL=getResultsForMarketer.js.map