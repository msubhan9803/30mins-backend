import {gql} from 'apollo-server-express';

export const queries = gql`
  type Query {
    getENV: String
  }
`;
