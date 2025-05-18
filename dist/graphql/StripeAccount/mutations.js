import { gql } from 'apollo-server-express';
export const mutations = gql `
  input StripeAccountInput {
    accountId: String
  }

  type Mutation {
    createStripeAccount(stripeAccountData: StripeAccountInput!, token: String!): Response
    updateStripeAccount(stripeAccountData: StripeAccountInput!): Response
    deleteStripeAccount(token: String!, documentId: String!): Response
  }
`;
//# sourceMappingURL=mutations.js.map