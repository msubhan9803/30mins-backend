var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Post from '../../../../MongoModels/Post';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getPostsByUserId(parent, { userId, offset, limit }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getPostsByUserId',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: userId,
                        paramType: typeof userId,
                    },
                ],
            });
            let posts = yield Post.find({
                userId: userId,
            }).sort({ createdAt: -1 });
            const recordsTotalCount = posts.length;
            if (offset !== null && limit !== null) {
                posts = posts.slice(offset, limit + offset);
            }
            if (posts.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getPostsByUserId',
                    functionParams: [
                        {
                            paramName: 'userId',
                            paramValue: userId,
                            paramType: typeof userId,
                        },
                    ],
                    additionalMessage: 'No Documents Found',
                    startLogId,
                });
                return {
                    response: {
                        message: 'No Documents Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getPostsByUserId',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: userId,
                        paramType: typeof userId,
                    },
                ],
                additionalMessage: 'Post Query Successful',
                startLogId,
            });
            return {
                postData: posts,
                response: {
                    message: 'Post Query Successful',
                    status: 200,
                },
                recordsTotalCount,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getPostsByUserId',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: userId,
                        paramType: typeof userId,
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
//# sourceMappingURL=getPostsByUserId.js.map