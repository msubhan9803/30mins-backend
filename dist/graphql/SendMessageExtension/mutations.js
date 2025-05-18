import { gql } from 'apollo-server-express';
export const mutations = gql `
  input SendMessageInput {
    name: String!
    email: String!
    providerEmail: String!
    providerName: String!
    phone: String
    subject: String!
    description: String!
    captcha: String!
  }

  type Mutation {
    createMessage(messageData: SendMessageInput): Response
  }
`;
//# sourceMappingURL=mutations.js.map