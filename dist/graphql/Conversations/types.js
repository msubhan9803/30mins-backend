import { gql } from 'apollo-server-express';
export const types = gql `
  type Conversation {
    members: [UserPublicAccountDetails]
    createdAt: String
    blocked: Boolean
    archived: [String]
  }
`;
//# sourceMappingURL=types.js.map