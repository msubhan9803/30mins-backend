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
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getUsersCount(parent, { token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getUsersCount',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    }
                ],
            });
            const userCount = yield User.count().exec();
            const userwelcomeCount = yield User.find({
                welcomeComplete: true,
            }).count().exec();
            return {
                usercount: userCount,
                welcomeData: userwelcomeCount,
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
                    functionName: 'getUsersCount',
                    functionParams: [
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
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getUsersCount',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
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
//# sourceMappingURL=getUserCount.js.map