import { gql } from 'apollo-server-express';
export const types = gql `
  type BlockedDomain {
    domain: String
    blockReason: String
  }
`;
//# sourceMappingURL=types.js.map