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
import Service from '../../../../MongoModels/Service';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getServicesForAdmin(parent, { serviceSearchParams, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const user = yield User.findById(decodedToken.UserId, 'accountDetails.accountType').exec();
            const { keywords, isOrgService, pageNumber, resultsPerPage } = serviceSearchParams;
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getServicesForAdmin',
                functionParams: [
                    {
                        paramName: 'serviceSearchParams',
                        paramValue: serviceSearchParams,
                        paramType: typeof serviceSearchParams,
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
                    functionName: 'getServicesForAdmin',
                    functionParams: [
                        {
                            paramName: 'serviceSearchParams',
                            paramValue: serviceSearchParams,
                            paramType: typeof serviceSearchParams,
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
            let keywordsQuery = [];
            const safeKeywords = escapeStringRegexp(keywords);
            const regex = new RegExp(safeKeywords, 'i');
            if (keywords) {
                keywordsQuery.push({ title: { $regex: regex } });
                keywordsQuery.push({ slug: { $regex: regex } });
                keywordsQuery.push({ currency: { $regex: regex } });
                if (parseInt(keywords)) {
                    keywordsQuery.push({ duration: parseInt(keywords) });
                }
                baseQuery['$or'] = keywordsQuery;
            }
            if (isOrgService) {
                baseQuery['isOrgService'] = isOrgService;
                keywordsQuery.push({ organizationName: { $regex: regex } });
            }
            const services = yield Service.find(baseQuery)
                .skip(pageNumber * resultsPerPage - resultsPerPage)
                .limit(resultsPerPage)
                .populate('userId', ['accountDetails.username', 'personalDetails.name'])
                .exec();
            const serviceCount = yield Service.count(baseQuery).exec();
            if (services.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getServicesForAdmin',
                    functionParams: [
                        {
                            paramName: 'serviceSearchParams',
                            paramValue: serviceSearchParams,
                            paramType: typeof serviceSearchParams,
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
                    serviceData: services,
                    serviceCount,
                    response: {
                        message: 'No Users Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getServicesForAdmin',
                functionParams: [
                    {
                        paramName: 'serviceSearchParams',
                        paramValue: serviceSearchParams,
                        paramType: typeof serviceSearchParams,
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
                serviceData: services,
                serviceCount,
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
                    functionName: 'getServicesForAdmin',
                    functionParams: [
                        {
                            paramName: 'serviceSearchParams',
                            paramValue: serviceSearchParams,
                            paramType: typeof serviceSearchParams,
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
                functionName: 'getServicesForAdmin',
                functionParams: [
                    {
                        paramName: 'serviceSearchParams',
                        paramValue: serviceSearchParams,
                        paramType: typeof serviceSearchParams,
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
//# sourceMappingURL=getServicesForAdmin.js.map