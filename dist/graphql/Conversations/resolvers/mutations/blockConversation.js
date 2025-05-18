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
export default function blockConversation(parent, { documentId, emailBlocker }, context, info) {
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
                paramName: 'emailBlocker',
                paramValue: emailBlocker,
                paramType: typeof emailBlocker,
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
                functionName: 'blockConversation',
                functionParams: functionParams,
            });
            const hasPermission = yield Conversation.exists({
                _id: documentId,
                members: { $elemMatch: { $eq: decodedToken.UserId } },
            });
            if (!hasPermission) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createConversation',
                    functionParams: functionParams,
                    additionalMessage: 'Not Authenticated:  The user does not have the block permission',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated: The user does not have the block permission',
                    status: 401,
                };
            }
            const conversation = yield Conversation.findById(documentId);
            let newblockedList = [];
            if (conversation.blocked.includes(emailBlocker)) {
                newblockedList = conversation.blocked.filter(el => el !== emailBlocker);
            }
            else {
                newblockedList = [...conversation.blocked, emailBlocker];
            }
            yield Conversation.findByIdAndUpdate(documentId, {
                blocked: newblockedList,
            });
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'blockConversation',
                functionParams: functionParams,
                additionalMessage: !conversation.blocked.includes(emailBlocker) ? 'Conversation is now blocked!' : 'Conversation is now unblocked!',
                startLogId,
            });
            return {
                message: !conversation.blocked.includes(emailBlocker) ? 'Conversation is now blocked!' : 'Conversation is now unblocked!',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'blockConversation',
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
                functionName: 'blockConversation',
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
//# sourceMappingURL=blockConversation.js.map