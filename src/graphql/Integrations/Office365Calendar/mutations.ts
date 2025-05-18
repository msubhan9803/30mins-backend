import {gql} from 'apollo-server-express';

export const mutations = gql`
  input OfficeCredentialsInput {
    access_token: String!
    refresh_token: String!
    scope: String!
    token_type: String!
    expires_in: String!
    ext_expires_in: String!
  }
  type Mutation {
    addOffice365Calendar(
      credentials: OfficeCredentialsInput!
      email: String!
      allowedProviders: [String]!
    ): Response
    deleteOffice365Calendar(token: String!, email: String!): Response
    updateOfficeRefreshToken(refreshToken: String!, credentialId: String!): Response
  }
`;
