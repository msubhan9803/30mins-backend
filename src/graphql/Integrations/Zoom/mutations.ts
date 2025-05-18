import {gql} from 'apollo-server-express';

export const mutations = gql`
  input ZoomCredentialsInput {
    access_token: String!
    refresh_token: String!
    scope: String!
    token_type: String!
    expires_in: Int!
  }
  type Mutation {
    addZoomCredentials(
      credentials: ZoomCredentialsInput!
      email: String!
      allowedProviders: [String]!
      credentialIdentifier: String!
    ): Response
    deleteZoomCredentials(token: String!, email: String!): Response
    deleteZoomCredentialsWebhook(credentialIdentifier: String!): Response
    updateZoomRefreshToken(refreshToken: String!, userId: String!): Response
  }
`;
