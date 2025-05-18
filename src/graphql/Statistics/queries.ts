import {gql} from 'apollo-server-express';

export const queries = gql`
  type GlobalBussinessResponse {
    globalBussinessStats: GlobalBussiness
    response: Response
  }

  type Query {
    getGlobalBussinessStats: GlobalBussinessResponse
  }
`;
