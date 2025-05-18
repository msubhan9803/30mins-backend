import createConversation from './mutations/createConversation';
import blockConversation from './mutations/blockConversation';
import deleteConversation from './mutations/deleteConversation';
import archiveConversation from './mutations/archiveConversation';
import hideConversation from './mutations/hideConversation';
import getConversationById from './queries/getConversationById';
import getAllConversations from './queries/getAllConversations';
const queries = { getAllConversations, getConversationById };
const mutations = {
    createConversation,
    blockConversation,
    deleteConversation,
    archiveConversation,
    hideConversation,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map