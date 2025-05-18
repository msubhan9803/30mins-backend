import {gql} from 'apollo-server-express';

export const queries = gql`
  input AdminCriteriaUserSearchParams {
    importedBatch: String
    welcomeComplete: Boolean
    verifiedEmail: Boolean
  }

  type Query {
    getUsersByCriteria(userSearchParams: AdminCriteriaUserSearchParams): AdminSearchResponse
  }
`;
