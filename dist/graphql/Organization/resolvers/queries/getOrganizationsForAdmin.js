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
import escapeStringRegexp from 'escape-string-regexp';
import Organization from '../../../../MongoModels/Organization';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
export default function getOrganizationsForAdmin(parent, { orgSearchParams }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        let decodedToken;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
            decodedToken = jwt.verify(context.token, accessTokenSecret);
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getOrganizationsForAdmin',
                functionParams: [
                    {
                        paramName: 'orgSearchParams',
                        paramValue: orgSearchParams,
                        paramType: typeof orgSearchParams,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: { message: 'Not Authorized', status: 401 },
            };
        }
        try {
            const { keywords, location, pageNumber, resultsPerPage } = orgSearchParams;
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationsForAdmin',
                functionParams: [
                    {
                        paramName: 'orgSearchParams',
                        paramValue: orgSearchParams,
                        paramType: typeof orgSearchParams,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const isAdminUser = yield User.exists({
                _id: decodedToken.UserId,
                'accountDetails.accountType': 'admin',
            });
            if (!isAdminUser) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getOrganizationsForAdmin',
                    functionParams: [
                        {
                            paramName: 'orgSearchParams',
                            paramValue: orgSearchParams,
                            paramType: typeof orgSearchParams,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            let baseQuery = { $and: [] };
            let skipCount = pageNumber * resultsPerPage - resultsPerPage;
            if (keywords) {
                const safeKeywords = escapeStringRegexp(keywords);
                const regex = new RegExp(safeKeywords, 'i');
                const keywordsQuery = { $or: [] };
                keywordsQuery.$or.push({ title: { $regex: regex } });
                keywordsQuery.$or.push({ headline: { $regex: regex } });
                keywordsQuery.$or.push({ description: { $regex: regex } });
                keywordsQuery.$or.push({ searchTags: { $regex: regex } });
                keywordsQuery.$or.push({ serviceCategories: { $regex: regex } });
                baseQuery.$and.push(keywordsQuery);
            }
            if (location) {
                const safeLocation = escapeStringRegexp(location);
                const regex = new RegExp(safeLocation, 'i');
                baseQuery.$and.push({ location: { $regex: regex } });
            }
            const constructedQuery = Object.assign({}, baseQuery);
            if (constructedQuery.$and.length === 0) {
                delete constructedQuery.$and;
            }
            const organizations = yield Organization.find(constructedQuery)
                .skip(skipCount)
                .limit(resultsPerPage)
                .exec();
            const organizationCount = yield Organization.count(constructedQuery);
            if (organizations.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getOrganizationsForAdmin',
                    functionParams: [
                        {
                            paramName: 'orgSearchParams',
                            paramValue: orgSearchParams,
                            paramType: typeof orgSearchParams,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'No Organizations Found',
                    startLogId,
                });
                return {
                    organizationData: organizations,
                    response: {
                        message: 'No Organizations Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationsForAdmin',
                functionParams: [
                    {
                        paramName: 'orgSearchParams',
                        paramValue: orgSearchParams,
                        paramType: typeof orgSearchParams,
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
                organizationData: organizations,
                organizationCount,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getOrganizationsForAdmin',
                functionParams: [
                    {
                        paramName: 'orgSearchParams',
                        paramValue: orgSearchParams,
                        paramType: typeof orgSearchParams,
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
                response: { message: 'Unknown Server Error - See Logs for details', status: 500 },
            };
        }
    });
}
//# sourceMappingURL=getOrganizationsForAdmin.js.map