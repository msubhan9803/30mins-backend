import { gql } from 'apollo-server-express';
export const mutations = gql `
  input haveAnIdeaInput {
    headline: String!
    description: String!
  }

  type Mutation {
    createHaveAnIdeaMessage(token: String!, messageData: haveAnIdeaInput): Response
  }
`;
//# sourceMappingURL=mutations.js.map