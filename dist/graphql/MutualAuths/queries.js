import { gql } from 'apollo-server-express';
export const queries = gql `
  enum AuthQueriesActoins {
    searchUnauthorizedUser
    getAuthorizedUser
    getPendingInvites
    getPendingRequest
  }
  input MutualAuthSearchParams {
    keywords: String
    pageNumber: Int
    resultsPerPage: Int
  }

  type MutualAuthUser {
    name: String
    username: String
    avatar: String
    email: String
  }

  type getMutualAuthUserDataResponse {
    response: Response
    User: MutualAuthUser
  }

  type Query {
    getMutualAuthList(
      token: String!
      actoin: AuthQueriesActoins!
      SearchParams: MutualAuthSearchParams!
    ): MutualAuthsDataResponse
  }
`;
// # getPublicationsByUserId(token: String!): PublicationsDataResponse
//# sourceMappingURL=queries.js.map