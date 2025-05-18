import { gql } from 'apollo-server-express';
export const queries = gql `
  input CommandedProductSearchParams {
    pageNumber: Int!
    resultsPerPage: Int!
  }
  type Query {
    getProductsByUserId(token: String!): ProductsDataResponse
    getProductById(documentId: String!, token: String!): ProductDataResponse
    getProductDownloadSuccessData(documentId: String!): ProductDataResponse
    getPublicProductsData(username: String!): ProductsDataResponse
    getCurrentCartItems(token: String!): CartProductsDataResponse
    getCountItemsAndSubtotal(token: String!): CartItemsDataResponse
    getProductQttById(token: String!, documentId: String): ProductQttDataResponse
    getAllCommandedProduct(
      token: String!
      searchParams: CommandedProductSearchParams
    ): ProductQttsDataResponse
    getAllCompletedCheckout(token: String!): GetAllCompletedCheckoutResponse
    getCompletedCheckoutId(checkoutID: String!, token: String!): GetCompletedCheckoutIdResponse
    getSellerByCheckout(checkoutId: String!): getSellerByCheckoutResponse
    getProductQttWithCompleteDetails(token: String!, documentId: String!): ProductQttDataResponse
    getProductDownloadUrl(token: String!, productId: String!): ProductDownloadUrlResponse
  }
`;
//# sourceMappingURL=queries.js.map