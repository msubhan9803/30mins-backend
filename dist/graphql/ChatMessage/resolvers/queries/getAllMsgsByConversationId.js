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
import Message from '../../../../MongoModels/Message';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getAllMsgsByConversationId(parent, { conversationId, paginationArgs }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(token, accessTokenSecret);
        let startLogId;
        const functionParams = [
            {
                paramName: 'conversationId',
                paramValue: conversationId,
                paramType: typeof conversationId,
            },
            {
                paramName: 'paginationArgs',
                paramValue: paginationArgs,
                paramType: typeof paginationArgs,
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
                functionName: 'getAllMsgsByConversationId',
                functionParams: functionParams,
            });
            const messagesDb = yield Message.find({
                conversationId,
                $or: [{ receiver: { $eq: decodedToken.UserId } }, { sender: { $eq: decodedToken.UserId } }],
            })
                .populate('sender', ['accountDetails.email'])
                .populate('receiver', ['accountDetails.email'])
                .sort({ createdAt: -1 })
                .skip((paginationArgs === null || paginationArgs === void 0 ? void 0 : paginationArgs.pageNumber) * (paginationArgs === null || paginationArgs === void 0 ? void 0 : paginationArgs.resultsPerPage) - (paginationArgs === null || paginationArgs === void 0 ? void 0 : paginationArgs.resultsPerPage))
                .limit(paginationArgs === null || paginationArgs === void 0 ? void 0 : paginationArgs.resultsPerPage);
            const messages = messagesDb.map(msg => {
                return {
                    _id: msg._id,
                    senderEmail: msg.sender.accountDetails.email,
                    receiverEmail: msg.receiver.accountDetails.email,
                    message: msg.message,
                    conversationId: msg.conversationId,
                    createdAt: msg.createdAt,
                };
            });
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getAllMsgsByConversationId',
                functionParams: functionParams,
                additionalMessage: 'Get All Message Successfull!',
                startLogId,
            });
            return {
                messages,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getAllMsgsByConversationId',
                    functionParams: functionParams,
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    response: {
                        message: err.message,
                        status: 500,
                    },
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getAllMsgsByConversationId',
                functionParams: functionParams,
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
//# sourceMappingURL=getAllMsgsByConversationId.js.map