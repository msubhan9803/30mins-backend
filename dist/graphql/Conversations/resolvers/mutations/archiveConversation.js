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
export default function archiveConversation(parent, { documentId, archivedEmail }, context, info) {
    var _a;
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
                paramName: 'isArchived',
                paramValue: archivedEmail,
                paramType: typeof archivedEmail,
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
                functionName: 'archiveConversation',
                functionParams: functionParams,
            });
            const conversationHasarshived = yield Conversation.findById(documentId);
            const EmailIndex = (_a = conversationHasarshived === null || conversationHasarshived === void 0 ? void 0 : conversationHasarshived.archived) === null || _a === void 0 ? void 0 : _a.indexOf(archivedEmail);
            if (EmailIndex === -1) {
                yield Conversation.findByIdAndUpdate(documentId, {
                    $push: {
                        archived: archivedEmail,
                    },
                });
            }
            else {
                yield Conversation.findByIdAndUpdate(documentId, {
                    $pull: {
                        archived: archivedEmail,
                    },
                });
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'archiveConversation',
                functionParams: functionParams,
                additionalMessage: EmailIndex === -1 ? 'Conversation is now archived!' : 'Conversation is now activated!',
                startLogId,
            });
            return {
                message: EmailIndex === -1 ? 'Conversation is now archived!' : 'Conversation is now activated!',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'archiveConversation',
                    functionParams: functionParams,
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'archiveConversation',
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
//# sourceMappingURL=archiveConversation.js.map