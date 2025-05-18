var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Service from '../../../../MongoModels/Service';
import escapeStringRegexp from 'escape-string-regexp';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import _ from 'lodash';
export default function getOrganizationServiceResults(parent, { documentId, searchParams }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationServiceResults',
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
            const { keywords, isPaid, pageNumber, resultsPerPage, searchTags } = searchParams;
            const constructedQuery = (searchTags === null || searchTags === void 0 ? void 0 : searchTags.length) > 0
                ? {
                    organizationId: documentId,
                    isPrivate: { $ne: true },
                    searchTags: { $in: searchTags === null || searchTags === void 0 ? void 0 : searchTags.map(t => new RegExp(t)) },
                }
                : {
                    organizationId: documentId,
                    isPrivate: { $ne: true },
                };
            if (isPaid !== null && isPaid !== undefined) {
                constructedQuery['isPaid'] = isPaid;
            }
            if (keywords) {
                const safeKeywords = escapeStringRegexp(keywords);
                const keywordRegex = new RegExp(safeKeywords, 'i');
                let keywordQuery = [];
                keywordQuery.push({ title: { $regex: keywordRegex } });
                // keywordQuery.push({description: {$regex: keywordRegex}});
                // keywordQuery.push({slug: {$regex: keywordRegex}});
                // keywordQuery.push({serviceCategory: {$regex: keywordRegex}});
                constructedQuery['$and'] = keywordQuery;
            }
            const serviceResults = yield Service.find(constructedQuery)
                .skip(pageNumber * resultsPerPage - resultsPerPage)
                .limit(resultsPerPage)
                .populate('userId', [
                '_id',
                'accountDetails.username',
                'accountDetails.avatar',
                'personalDetails.name',
                'personalDetails.headline',
                'personalDetails.description',
                'personalDetails.socials',
            ])
                .populate('organizationId', ['_id', 'title', 'slug'])
                .exec();
            const serviceCount = yield Service.count(constructedQuery);
            let ListOftags = yield Service.find({ organizationId: documentId }).select('searchTags');
            ListOftags = _.union(...ListOftags.map(el => el.searchTags));
            if (serviceResults.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getOrganizationServiceResults',
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
                functionName: 'getOrganizationServiceResults',
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
                services: serviceResults,
                serviceCount,
                allOrgTags: ListOftags
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getOrganizationServiceResults',
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
//# sourceMappingURL=getOrganizationServiceResults.js.map