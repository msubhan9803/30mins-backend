var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Conversation from '../../../../MongoModels/Conversation';
import Message from '../../../../MongoModels/Message';
export default function deleteChatMessage(parent, { documentId, conversationId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(token, accessTokenSecret);
        let startLogId;
        const functionParams = [
            {
                paramName: 'documentId',
                paramValue: documentId,
                paramType: typeof documentId,
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
        ];
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'deleteChatMessage',
                functionParams: functionParams,
            });
            const hasPermission = yield Conversation.exists({
                _id: conversationId,
                members: { $elemMatch: { $eq: decodedToken.UserId } },
            });
            if (!hasPermission) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteChatMessage',
                    functionParams: functionParams,
                    additionalMessage: 'Not Authenticated:  The user does not have the delete permission',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated: The user does not have the delete permission',
                    status: 401,
                };
            }
            const message = yield Message.findByIdAndDelete(documentId);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'deleteChatMessage',
                functionParams: functionParams,
                additionalMessage: 'Message is Deleted!',
                startLogId,
            });
            return {
                messageId: message._id,
                response: {
                    message: 'Message is Deleted!',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteChatMessage',
                    functionParams: functionParams,
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'deleteChatMessage',
                functionParams: functionParams,
                additionalMessage: err.message,
                startLogId,
            });
            return {
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=deleteChatMessage.js.map