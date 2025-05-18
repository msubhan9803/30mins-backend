import { gql } from 'apollo-server-express';
export const types = gql `
  type subsMessageResponse {
    _id: String
    senderEmail: String
    receiverEmail: String
    message: String
    avatar: String
    blocked: [String]
    username: String
    createdAt: String
    unreadMessageCount: String
    conversationId: String
  }
  type subsTypingResponse {
    senderEmail: String
    receiverEmail: String
    conversationId: String
    message: String
  }

  type ChatMessageResponse {
    messageId: String
    response: Response
  }
  type ChatMessage {
    _id: String
    receiver: UserPublicAccountDetails
    sender: UserPublicAccountDetails
    message: String
    unread: Boolean
    conversationId: String
    createdAt: String
  }
  type GetAllMessageResponse {
    messages: [subsMessageResponse]
  }
`;
//# sourceMappingURL=types.js.map