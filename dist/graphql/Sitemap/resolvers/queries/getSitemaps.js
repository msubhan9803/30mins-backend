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
export default function getSitemaps() {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getSitemaps',
                functionParams: [
                    {
                        paramName: 'No Params',
                        paramValue: "No Params",
                        paramType: "No Params",
                    },
                ],
            });
            const sitemapsData = yield Sitemap.aggregate([
                {
                    $project: {
                        _id: 1,
                        sitemapType: 1,
                        index: 1
                    }
                },
                {
                    $group: {
                        _id: "$sitemapType",
                        "sitemaps": {
                            $push: "$$ROOT",
                        }
                    }
                },
                { $sort: { "_id": 1 } },
            ]);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getSitemaps',
                functionParams: [
                    {
                        paramName: 'No Params',
                        paramValue: "No Params",
                        paramType: "No Params",
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId
            });
            return {
                groups: sitemapsData,
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
                functionName: 'getSitemaps',
                functionParams: [
                    {
                        paramName: 'No Params',
                        paramValue: "No Params",
                        paramType: "No Params",
                    },
                ],
                additionalMessage: err.message,
                startLogId
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
//# sourceMappingURL=getSitemaps.js.map