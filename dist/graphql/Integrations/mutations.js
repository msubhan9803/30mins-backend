import { gql } from 'apollo-server-express';
export const mutations = gql `
  type Mutation {
    toggleCredentialById(credentialId: String!, token: String!): Response
  }
`;
//# sourceMappingURL=mutations.js.map