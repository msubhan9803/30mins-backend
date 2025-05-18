var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable @typescript-eslint/no-unused-vars */
import Charity from '../../../../MongoModels/Charity';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import escapeStringRegexp from 'escape-string-regexp';
// eslint-disable-next-line no-unused-vars
export default function getPublicCharities(parent, { pageNumber, resultsPerPage, keywords, sortKey, sortValue }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getPublicCharities',
                functionParams: [
                    {
                        paramName: 'pageNumber',
                        paramValue: pageNumber,
                        paramType: typeof pageNumber,
                    },
                    {
                        paramName: 'resultsPerPage',
                        paramValue: resultsPerPage,
                        paramType: typeof resultsPerPage,
                    },
                ],
            });
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getPublicCharities',
                    functionParams: [
                        {
                            paramName: 'pageNumber',
                            paramValue: pageNumber,
                            paramType: typeof pageNumber,
                        },
                        {
                            paramName: 'resultsPerPage',
                            paramValue: resultsPerPage,
                            paramType: typeof resultsPerPage,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid BACKEND_API_KEY',
                    startLogId,
                });
                return {
                    userData: null,
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            let baseQuery = {};
            if (keywords) {
                const keywordsQuery = [];
                const safeKeywords = escapeStringRegexp(keywords);
                const regex = new RegExp(safeKeywords, 'i');
                keywordsQuery.push({ name: { $regex: regex } });
                keywordsQuery.push({ taxID: { $regex: regex } });
                keywordsQuery.push({ website: { $regex: regex } });
                baseQuery = {
                    $or: keywordsQuery,
                };
            }
            const charities = yield Charity.find(baseQuery)
                .sort({ [sortKey ? sortKey : '_id']: sortValue ? sortValue : 1 })
                .skip(pageNumber * resultsPerPage - resultsPerPage)
                .limit(resultsPerPage);
            const charitiesCount = yield Charity.find(baseQuery).count();
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getPublicCharities',
                functionParams: [
                    {
                        paramName: 'pageNumber',
                        paramValue: pageNumber,
                        paramType: typeof pageNumber,
                    },
                    {
                        paramName: 'resultsPerPage',
                        paramValue: resultsPerPage,
                        paramType: typeof resultsPerPage,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                charityData: charities,
                charityCount: charitiesCount,
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
                functionName: 'getPublicCharities',
                functionParams: [
                    {
                        paramName: 'pageNumber',
                        paramValue: pageNumber,
                        paramType: typeof pageNumber,
                    },
                    {
                        paramName: 'resultsPerPage',
                        paramValue: resultsPerPage,
                        paramType: typeof resultsPerPage,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                charityData: [],
                charityCount: 0,
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=getPublicCharities.js.map