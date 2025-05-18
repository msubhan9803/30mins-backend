import { gql } from 'apollo-server-express';
export const types = gql `
  type ActiveExtension {
    _id: String
    userId: String
    extensionTitle: String
    extensionProductId: String
    paymentMethodId: String
    subscriptionId: String
    customerId: String
    status: String
  }

  type ActiveExtensionForAdmin {
    _id: String
    userId: User
    extensionTitle: String
    extensionProductId: String
    paymentMethodId: String
    subscriptionId: String
    customerId: String
    status: String
    createdDate: String
  }

  type ActiveExtensionsDataResponse {
    response: Response
    activeExtensionData: [ActiveExtension]
  }

  type ActiveExtensionsAdminDataResponse {
    response: Response
    activeExtensionData: [ActiveExtensionForAdmin]
    extensionsCount: Int
  }
  type UserExtensions {
    response: Response
    extensionCount: Int
  }
  
  type ActiveExtensionDataResponse {
    response: Response
    activeExtensionData: ActiveExtension
  }
  type CheckActiveExtensionResonse {
    status: String
    isActive: Boolean
    response: Response
  }
`;
//# sourceMappingURL=types.js.map