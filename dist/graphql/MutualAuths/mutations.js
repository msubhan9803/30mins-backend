import { gql } from 'apollo-server-express';
export const mutations = gql `
  type AuthResponse {
    token: String
    Data: MutualAuths
  }

  type Mutation {
    updateMutualAuths(
      token: String
      origin: String
      ownerEmail: String
      actoin: authsActoins
      AuthCode: String
    ): AuthResponse
  }
`;
//# sourceMappingURL=mutations.js.map