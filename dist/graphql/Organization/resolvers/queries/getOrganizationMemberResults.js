var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Organization from '../../../../MongoModels/Organization';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getOrganizationMemberResults(parent, { documentId, searchParams }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationMemberResults',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'searchParams',
                        paramValue: searchParams,
                        paramType: typeof searchParams,
                    },
                ],
            });
            const { members } = yield Organization.findById(documentId, 'members').exec();
            const { keywords, pageNumber, resultsPerPage } = searchParams;
            const baseQuery = { $or: [] };
            if (keywords) {
                const safeKeywords = escapeStringRegexp(keywords);
                const regex = new RegExp(safeKeywords, 'i');
                const keywordsQuery = [];
                keywordsQuery.push({ 'accountDetails.username': { $regex: regex } });
                keywordsQuery.push({ 'accountDetails.email': { $regex: regex } });
                keywordsQuery.push({ 'personalDetails.headline': { $regex: regex } });
                keywordsQuery.push({ 'personalDetails.name': { $regex: regex } });
                keywordsQuery.push({ 'personalDetails.searchTags': { $regex: regex } });
                keywordsQuery.push({ 'locationDetails.country': { $regex: regex } });
                keywordsQuery.push({ 'locationDetails.zipCode': { $regex: regex } });
                baseQuery.$or = keywordsQuery;
            }
            if (baseQuery.$or.length === 0) {
                delete baseQuery.$or;
            }
            const constructedQuery = Object.assign({ _id: { $in: members }, 'accountDetails.privateAccount': false }, baseQuery);
            const memberResults = yield User.find(constructedQuery)
                .skip(pageNumber * resultsPerPage - resultsPerPage)
                .limit(resultsPerPage)
                .exec();
            const userCount = yield User.count(constructedQuery);
            if (memberResults.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getOrganizationMemberResults',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                        {
                            paramName: 'searchParams',
                            paramValue: searchParams,
                            paramType: typeof searchParams,
                        },
                    ],
                    additionalMessage: 'Document Not Found',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Document Not Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationMemberResults',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'searchParams',
                        paramValue: searchParams,
                        paramType: typeof searchParams,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
                userData: memberResults,
                userCount,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getOrganizationMemberResults',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'searchParams',
                        paramValue: searchParams,
                        paramType: typeof searchParams,
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
//# sourceMappingURL=getOrganizationMemberResults.js.map