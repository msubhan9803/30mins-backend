var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import Service from '../../../../MongoModels/Service';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
export default function getServicesForBackend(parent, { serviceSearchParams }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const { keywords } = serviceSearchParams;
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'backendUpdateUser',
                    functionParams: [
                        {
                            paramName: 'serviceSearchParams',
                            paramValue: serviceSearchParams,
                            paramType: typeof serviceSearchParams,
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
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getServicesForBackend',
                functionParams: [
                    {
                        paramName: 'serviceSearchParams',
                        paramValue: serviceSearchParams,
                        paramType: typeof serviceSearchParams,
                    },
                ],
            });
            let serviceBaseQuery = {};
            let serviceKeywordsQuery = [];
            const safeKeywords = escapeStringRegexp(keywords);
            const regex = new RegExp(safeKeywords, 'i');
            if (keywords) {
                serviceKeywordsQuery.push({ title: { $regex: regex } });
                serviceKeywordsQuery.push({ description: { $regex: regex } });
                serviceKeywordsQuery.push({ slug: { $regex: regex } });
                serviceKeywordsQuery.push({ currency: { $regex: regex } });
                const users = yield User.find({ 'accountDetails.email': { $regex: regex } });
                const userIDs = users.map(user => user._id);
                if (userIDs.length !== 0) {
                    serviceKeywordsQuery.push({ userId: { $in: userIDs } });
                }
                if (parseInt(keywords)) {
                    serviceKeywordsQuery.push({ duration: parseInt(keywords) });
                }
                serviceBaseQuery['$or'] = serviceKeywordsQuery;
            }
            const services = yield Service.find(serviceBaseQuery).populate('userId', [
                'accountDetails.username',
                'personalDetails.name',
                'accountDetails.email',
            ]);
            let serviceCount = yield Service.count(serviceBaseQuery);
            if (services.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getServicesForBackend',
                    functionParams: [
                        {
                            paramName: 'serviceSearchParams',
                            paramValue: serviceSearchParams,
                            paramType: typeof serviceSearchParams,
                        },
                    ],
                    additionalMessage: 'No Services Found',
                    startLogId,
                });
                return {
                    serviceData: services,
                    serviceCount,
                    response: {
                        message: 'No Services Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getServicesForBackend',
                functionParams: [
                    {
                        paramName: 'serviceSearchParams',
                        paramValue: serviceSearchParams,
                        paramType: typeof serviceSearchParams,
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
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getServicesForBackend',
                functionParams: [
                    {
                        paramName: 'serviceSearchParams',
                        paramValue: serviceSearchParams,
                        paramType: typeof serviceSearchParams,
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
//# sourceMappingURL=getServicesForBackend.js.map