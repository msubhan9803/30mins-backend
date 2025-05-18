import { gql } from 'apollo-server-express';
export const mutations = gql `
  type createConResponse {
    response: Response
    conversationID: String
  }
  type Mutation {
    createConversation(membersEmail: [String]): createConResponse
    deleteConversation(documentId: String): Response
    blockConversation(documentId: String, emailBlocker: String): Response
    archiveConversation(documentId: String, archivedEmail: String): Response
    hideConversation(documentId: String, hideEmail: String): Response
  }
`;
//# sourceMappingURL=mutations.js.map