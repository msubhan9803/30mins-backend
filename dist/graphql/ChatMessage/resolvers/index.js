import createChatMessage from './mutations/createChatMessage';
import newMessage from './subcriptions/newMessage';
import deleteChatMessage from './mutations/deleteChatMessage';
import getAllMsgsByConversationId from './queries/getAllMsgsByConversationId';
import startedTyping from './subcriptions/startedTyping';
import notifyTyping from './mutations/notifyTyping';
import getConversationUnReadMsgCount from './queries/getConversationUnReadMsgCount';
import getTotalUnreadMsgs from './queries/getTotalUnreadMsgs';
import markReadMessageOfConversation from './mutations/markReadMessageOfConversation';
const subscriptions = { newMessage, startedTyping };
const queries = { getAllMsgsByConversationId, getConversationUnReadMsgCount, getTotalUnreadMsgs };
const mutations = {
    createChatMessage,
    deleteChatMessage,
    notifyTyping,
    markReadMessageOfConversation,
};
export const resolvers = { queries, subscriptions, mutations };
//# sourceMappingURL=index.js.map