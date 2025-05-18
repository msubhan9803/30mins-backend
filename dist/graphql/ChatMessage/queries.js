import { gql } from 'apollo-server-express';
export const queries = gql `
  type UnreadMsgCount {
    unreadMessageCount: Int
    response: Response
  }
  type Query {
    getAllMsgsByConversationId(
      conversationId: String!
      paginationArgs: PaginationArgs
    ): GetAllMessageResponse
    getConversationUnReadMsgCount(conversationId: String!, receiverEmail: String): UnreadMsgCount
    getTotalUnreadMsgs: UnreadMsgCount
  }
`;
//# sourceMappingURL=queries.js.map