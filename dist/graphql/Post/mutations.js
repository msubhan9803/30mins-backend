import { gql } from 'apollo-server-express';
export const mutations = gql `
  input PostInput {
    title: String
    image: String
    description: String
    tags: [String]
  }

  type Mutation {
    createPost(postData: PostInput, token: String!): Response
    editPost(postData: PostInput, documentId: String!, token: String!): Response
    deletePost(documentId: String!, token: String!): Response
  }
`;
//# sourceMappingURL=mutations.js.map