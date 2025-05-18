import { gql } from 'apollo-server-express';
export const subscriptions = gql `
  type Subscription {
    newMessage(email: String): subsMessageResponse
  }
  type Subscription {
    startedTyping: subsTypingResponse
  }

`;
//# sourceMappingURL=subscriptions.js.map