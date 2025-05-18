import { gql } from 'apollo-server-express';
export const types = gql `
  type Post {
    _id: String
    title: String
    image: String
    description: String
    tags: [String]
    createdAt: String
  }

  type PostDataResponse {
    response: Response
    postData: Post
  }

  # Multiple
  type PostsDataResponse {
    response: Response
    postData: [Post]
    recordsTotalCount: Int
  }
`;
//# sourceMappingURL=types.js.map