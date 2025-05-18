import {gql} from 'apollo-server-express';

export const mutations = gql`
  input ProductFileTypeInput {
    name: String
    link: String
  }

  input ProductInput {
    title: String
    price: Float
    discount: Float
    description: String
    image: String
    tags: [String]
    type: ProductTypeEnum
    file: ProductFileTypeInput
    resText: String
    service: String
    serviceMessage: String
  }

  type Mutation {
    createProduct(productData: ProductInput, token: String!): Response
    deleteProduct(documentId: String!, token: String!): Response
    editProduct(productData: ProductInput, documentId: String!, token: String!): Response
    addCart(productId: String!, quantity: Int!, token: String!): Response
    updateCart(productQttId: String, productId: String!, quantity: Int!, token: String!): Response
    deleteCart(productQttId: String!, token: String!): Response
    checkout(token: String!): checkoutResponse
    productQttUpdateStatus(
      token: String
      productQttId: String
      authCode: String
      action: ProductQttRefundTypeEnum
      refundReason: String
    ): Response
  }
`;
