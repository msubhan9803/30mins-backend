var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SUBSCRIPTIONS_EVENTS } from '../../../../constants/enums';
import Message from '../../../../MongoModels/Message';
import pubSub from '../pubSub';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import Conversation from '../../../../MongoModels/Conversation';
export default function createChatMessage(parent, { senderEmail, createdAt, receiverEmail, conversationId, message }, context) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(token, accessTokenSecret);
        let startLogId;
        const functionParams = [
            {
                paramName: 'senderEmail',
                paramValue: senderEmail,
                paramType: typeof senderEmail,
            },
            {
                paramName: 'receiverEmail',
                paramValue: receiverEmail,
                paramType: typeof receiverEmail,
            },
            {
                paramName: 'conversationId',
                paramValue: conversationId,
                paramType: typeof conversationId,
            },
            {
                paramName: 'message',
                paramValue: message,
                paramType: typeof message,
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
                functionName: 'createChatMessage',
                functionParams: functionParams,
            });
            const senderUser = yield User.findOne({ 'accountDetails.email': senderEmail }, [
                '_id',
                'accountDetails.avatar',
                'accountDetails.username',
            ]);
            const receiverUser = yield User.findOne({ 'accountDetails.email': receiverEmail }, ['_id']);
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { _id } = yield Message.create({
                sender: senderUser === null || senderUser === void 0 ? void 0 : senderUser._id,
                receiver: receiverUser === null || receiverUser === void 0 ? void 0 : receiverUser._id,
                message: message,
                createdAt: createdAt,
                conversationId: conversationId,
                unread: true,
            });
            const conversation = yield Conversation.findById(conversationId);
            if (conversation.hidden.length > 0) {
                conversation.hidden = [];
                yield conversation.save();
            }
            const unreadMessageCount = yield Message.count({
                receiver: receiverUser === null || receiverUser === void 0 ? void 0 : receiverUser._id,
                unread: true,
            });
            pubSub.publish(SUBSCRIPTIONS_EVENTS.CREATE_MESSAGE_EVENT, {
                newMessage: {
                    _id,
                    senderEmail,
                    receiverEmail,
                    message,
                    username: (_a = senderUser === null || senderUser === void 0 ? void 0 : senderUser.accountDetails) === null || _a === void 0 ? void 0 : _a.username,
                    avatar: (_b = senderUser === null || senderUser === void 0 ? void 0 : senderUser.accountDetails) === null || _b === void 0 ? void 0 : _b.avatar,
                    conversationId,
                    unreadMessageCount: unreadMessageCount,
                    blocked: conversation.blocked,
                    createdAt,
                    email: receiverEmail,
                },
            });
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'createChatMessage',
                functionParams: functionParams,
                additionalMessage: 'Message is Sent Successfully!',
                startLogId,
            });
            return {
                messageId: _id,
                response: {
                    status: 200,
                    message: 'The Sent Successfully',
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createChatMessage',
                    functionParams: functionParams,
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'createChatMessage',
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
//# sourceMappingURL=createChatMessage.js.map