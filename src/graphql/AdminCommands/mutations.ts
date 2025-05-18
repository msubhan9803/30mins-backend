import {gql} from 'apollo-server-express';

export const mutations = gql`
  input AdminDeleteInput {
    importedBatch: String!
    welcomeComplete: Boolean!
    verifiedEmail: Boolean!
  }

  type AdminCriteriaDeleteResponse {
    response: Response
    deletedCount: Int
  }

  type Mutation {
    deleteUsersByCriteria(criteria: AdminDeleteInput!): AdminCriteriaDeleteResponse!
  }
`;
