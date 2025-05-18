import {gql} from 'apollo-server-express';

export const queries = gql`
  input ExtensionSearchParams {
    keywords: String
    pageNumber: Int!
    resultsPerPage: Int!
  }

  type Query {
    getActiveExtensions(token: String!): ActiveExtensionsDataResponse
    getExtensionsCounts(token: String!): UserExtensions
    getActiveExtensionsForAdmin(
      searchParams: ExtensionSearchParams!
    ): ActiveExtensionsAdminDataResponse
    getActiveExtensionById(token: String!, documentId: String!): ActiveExtensionDataResponse
    getActiveExtensionByProductId(token: String!, productId: String!): ActiveExtensionDataResponse
    """
      WHAT IT DOES: Checks if Extension is Active or not and
      Return the Status of extension

    INPUT: Product ID of extension
    OUTPUT: Status of Product Id, isAtive and response
    """
    checkExtensionStatus(productId: String!): CheckActiveExtensionResonse
  }
`;
