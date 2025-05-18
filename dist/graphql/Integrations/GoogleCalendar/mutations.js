import { gql } from 'apollo-server-express';
export const mutations = gql `
  input GoogleCredentialsInput {
    access_token: String!
    refresh_token: String!
    scope: String!
    token_type: String!
    expiry_date: String!
  }
  type Mutation {
    addGoogleCalendar(credentials: GoogleCredentialsInput!, email: String!): Response
    deleteGoogleCalendar(token: String!, email: String!): Response
    updateGoogleRefreshToken(refreshToken: String!, credentialId: String!): Response
  }
`;
//# sourceMappingURL=mutations.js.map