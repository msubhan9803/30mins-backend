import { gql } from 'apollo-server-express';
export const mutations = gql `
  input CharityInput {
    name: String!
    taxID: String!
    description: String!
    website: String
  }

  type Mutation {
    createCharity(charityData: CharityInput!, token: String!): Response
    updateCharity(charityData: CharityInput!, token: String!, documentId: String!): Response
    deleteCharity(token: String!, documentId: String!): Response
  }
`;
//# sourceMappingURL=mutations.js.map