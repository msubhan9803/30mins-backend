import { gql } from 'apollo-server-express';
export const queries = gql `
  type Query {
    getPostById(documentId: String!, token: String!): PostDataResponse
    getPostsByUserId(userId: String!, offset: Int, limit: Int): PostsDataResponse
    getPostsByUserToken(token: String!, offset: Int, limit: Int): PostsDataResponse
  }
`;
//# sourceMappingURL=queries.js.map