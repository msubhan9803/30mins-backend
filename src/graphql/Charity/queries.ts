import {gql} from 'apollo-server-express';

export const queries = gql`
  type Query {
    getCharities(token: String!): CharityDataResponse
    getPublicCharities(
      pageNumber: Int!
      resultsPerPage: Int!
      keywords: String!
      sortKey: String!
      sortValue: Int!
    ): CharityPublicDataResponse
    getCharityById(token: String!, documentId: String!): SingleCharityDataResponse
    getPublicCharityById(documentId: String!): SingleCharityDataResponse
  }
`;
