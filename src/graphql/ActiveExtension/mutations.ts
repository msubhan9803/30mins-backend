import {gql} from 'apollo-server-express';

export const mutations = gql`
  input ActiveExtensionInput {
    extensionTitle: String
    extensionProductId: String
    paymentMethodId: String
    subscriptionId: String
    customerId: String
    status: String
  }

  type Mutation {
    createActiveExtension(activeExtensionData: ActiveExtensionInput!, token: String!): Response
    updateActiveExtension(
      activeExtensionData: ActiveExtensionInput!
      customerId: String!
      subscriptionId: String!
    ): Response
    deleteActiveExtension(token: String!, documentId: String!): Response
    adminDeleteActiveExtension(documentId: String!): Response
    addGiftedExtension(
      extensionProductId: String!
      extensionTitle: String!
      userEmail: String!
    ): Response
    adminAddGiftedExtension(
      extensionProductId: String!
      extensionTitle: String!
      userEmail: String!
    ): Response
    removeGiftedExtension(extensionProductId: String!, userEmail: String!): Response
  }
`;
