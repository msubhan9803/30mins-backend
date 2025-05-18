import { gql } from 'apollo-server-express';
export const queries = gql `
  type Query {
    getJobHistoryById(documentId: String!, token: String!): JobHistoryDataResponse
    getJobHistoryByUserId(token: String!): MultiJobHistoryDataResponse
  }
`;
//# sourceMappingURL=queries.js.map