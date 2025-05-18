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
export default function getUserForStartConversation(parent, { keyword }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        const functionName = 'getUserForStartConversation';
        const functionParams = [
            {
                paramName: 'keyword',
                paramValue: keyword,
                paramType: typeof keyword,
            },
        ];
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName,
                functionParams,
            });
            const user = yield User.findOne({
                $or: [
                    { 'accountDetails.email': { $regex: keyword, $options: 'i' } },
                    { 'accountDetails.username': { $regex: keyword, $options: 'i' } },
                ],
            }, [
                'accountDetails.email',
                'accountDetails.username',
                'personalDetails.name',
                'accountDetails.avatar',
            ]);
            console.log('user: ', user);
            if (!user) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName,
                    functionParams,
                    additionalMessage: 'No User Found',
                    startLogId,
                });
                return {
                    userData: user,
                    response: {
                        message: 'No user Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName,
                functionParams,
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                userData: user,
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
                functionName,
                functionParams,
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=getUserForStartConversation.js.map