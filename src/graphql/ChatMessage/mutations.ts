import {gql} from 'apollo-server-express';

export const mutations = gql`
  type Mutation {
    createChatMessage(
      senderEmail: String
      createdAt: String
      receiverEmail: String
      message: String
      conversationId: String
    ): ChatMessageResponse

    deleteChatMessage(documentId: String, conversationId: String): ChatMessageResponse

    notifyTyping(
      message: String
      senderEmail: String
      receiverEmail: String
      conversationId: String
    ): Response

    markReadMessageOfConversation(conversationId: String): Response
  }
`;
