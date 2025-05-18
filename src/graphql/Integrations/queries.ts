import {gql} from 'apollo-server-express';

export const queries = gql`
  type Query {
    getCredentialsByUserId(userId: String!): CredentialsResponse
    getCredentialsByToken(token: String!): CredentialsResponse
    getCredentialsByEmail(email: String!): CheckCredentialsResponse
  }
`;
