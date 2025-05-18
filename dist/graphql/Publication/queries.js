import { gql } from 'apollo-server-express';
export const queries = gql `
  type Query {
    getPublicationById(documentId: String!, token: String!): PublicationDataResponse
    getPublicationsByUserId(token: String!): PublicationsDataResponse
  }
`;
//# sourceMappingURL=queries.js.map