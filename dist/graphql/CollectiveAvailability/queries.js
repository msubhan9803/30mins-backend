import { gql } from 'apollo-server-express';
export const queries = gql `
  type Query {
    """
    Give all users created by logged in user
    """
    getAllGroups: GroupDataResponse
    """
    Give the group data with specific id
    """
    getGroupById(documentId: String!): SingleGroupDataResponse
    """
    Collective availability of all users,
    RETURNS: Array of time slots
    """
    getCollectiveAvailability(
      emails: [String]!
      date: String!
      duration: Int!
      checkExtension: Boolean!
    ): CollectiveAvailabilityResponse
  }
`;
//# sourceMappingURL=queries.js.map