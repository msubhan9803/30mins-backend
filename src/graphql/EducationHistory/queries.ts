import {gql} from 'apollo-server-express';

export const queries = gql`
  type Query {
    getEducationHistoryById(documentId: String!, token: String!): EducationHistoryDataResponse
    getEducationHistoryByUserId(token: String!): MultiEducationHistoryDataResponse
  }
`;
