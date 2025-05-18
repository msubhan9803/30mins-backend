var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Sitemap from '../../../../MongoModels/Sitemap';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getSitemap(parent, { sitemapIndex, sitemapType }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getSitemap',
                functionParams: [
                    {
                        paramName: 'sitemapIndex',
                        paramValue: sitemapIndex,
                        paramType: typeof sitemapIndex,
                    },
                    {
                        paramName: 'sitemapType',
                        paramValue: sitemapType,
                        paramType: typeof sitemapType,
                    },
                ],
            });
            const sitemap = yield Sitemap.findOne({
                index: sitemapIndex,
                sitemapType: sitemapType
            }).exec();
            if (!sitemap) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getSitemap',
                    functionParams: [
                        {
                            paramName: 'sitemapIndex',
                            paramValue: sitemapIndex,
                            paramType: typeof sitemapIndex,
                        },
                        {
                            paramName: 'sitemapType',
                            paramValue: sitemapType,
                            paramType: typeof sitemapType,
                        },
                    ],
                    additionalMessage: 'Sitemap Not Found',
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
                functionName: 'getSitemap',
                functionParams: [
                    {
                        paramName: 'sitemapIndex',
                        paramValue: sitemapIndex,
                        paramType: typeof sitemapIndex,
                    },
                    {
                        paramName: 'sitemapType',
                        paramValue: sitemapType,
                        paramType: typeof sitemapType,
                    },
                ],
                additionalMessage: 'Sitemap Query Successful',
                startLogId,
            });
            return {
                sitemap: sitemap,
                response: {
                    message: 'Sitemap Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getSitemap',
                functionParams: [
                    {
                        paramName: 'sitemapIndex',
                        paramValue: sitemapIndex,
                        paramType: typeof sitemapIndex,
                    },
                    {
                        paramName: 'sitemapType',
                        paramValue: sitemapType,
                        paramType: typeof sitemapType,
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
//# sourceMappingURL=getSitemap.js.map