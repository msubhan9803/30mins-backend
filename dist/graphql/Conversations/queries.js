import { gql } from 'apollo-server-express';
export const queries = gql `
  type Conversation {
    _id: String
    members: [UserPublicAccountDetails]
    createdAt: String
    hidden: [String]
    archived: [String]
    blocked: [String]
  }
  type ConversationUnReadCount {
    _id: String
    members: [UserPublicAccountDetails]
    createdAt: String
    unreadMessageCount: Int
    hidden: [String]
    archived: [String]
    blocked: [String]
  }
  type ConversationsResponseUnreadMsg {
    conversations: [ConversationUnReadCount]
    response: Response
  }
  type ConversationsResponse {
    conversations: [Conversation]
    response: Response
  }
  type ConversationResponse {
    conversation: Conversation
    response: Response
  }
  type Query {
    getAllConversations(paginationArgs: PaginationArgs): ConversationsResponseUnreadMsg
    getConversationById(documentId: String): ConversationResponse
  }
`;
//# sourceMappingURL=queries.js.map