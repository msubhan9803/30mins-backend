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
export default function getAllConversations(parent, { paginationArgs }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(token, accessTokenSecret);
        let startLogId;
        const functionParams = [
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
                functionName: 'getAllConversations',
                functionParams: functionParams,
            });
            const conversations = yield Conversation.find({
                members: {
                    $elemMatch: { $eq: decodedToken.UserId },
                },
            })
                .sort({ createdAt: -1 })
                .populate('members', ['personalDetails', 'accountDetails'])
                .skip((paginationArgs === null || paginationArgs === void 0 ? void 0 : paginationArgs.pageNumber) * (paginationArgs === null || paginationArgs === void 0 ? void 0 : paginationArgs.resultsPerPage) - (paginationArgs === null || paginationArgs === void 0 ? void 0 : paginationArgs.resultsPerPage))
                .limit(paginationArgs === null || paginationArgs === void 0 ? void 0 : paginationArgs.resultsPerPage);
            const conversationIds = conversations.map(c => c._id);
            let sortedConversations = yield Promise.all(conversations.map((conversation) => __awaiter(this, void 0, void 0, function* () {
                const message = yield Message.find({ conversationId: conversation._id }, ['_id', 'createdAt', 'message'], { limit: 1 }).sort({ $natural: -1 });
                const unreadMessageCount = yield Message.count({
                    receiver: decodedToken.UserId,
                    conversationId: conversation._id,
                    unread: true,
                });
                conversation._doc.unreadMessageCount = unreadMessageCount;
                return Object.assign(Object.assign({}, conversation), { lastMessage: message });
            })));
            sortedConversations = sortedConversations.sort((a, b) => {
                var _a, _b;
                return (new Date(((_a = b === null || b === void 0 ? void 0 : b.lastMessage[0]) === null || _a === void 0 ? void 0 : _a.createdAt) || 0).getTime() -
                    new Date(((_b = a === null || a === void 0 ? void 0 : a.lastMessage[0]) === null || _b === void 0 ? void 0 : _b.createdAt) || 0).getTime());
            });
            sortedConversations = sortedConversations.map(doc => doc._doc);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getAllConversations',
                functionParams: functionParams,
                additionalMessage: 'Get All Conversation Successfull!',
                startLogId,
            });
            return {
                conversations: sortedConversations,
                response: {
                    message: 'Get All Conversation Successfull!',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getAllConversations',
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
                functionName: 'getAllConversations',
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
//# sourceMappingURL=getAllConversations.js.map