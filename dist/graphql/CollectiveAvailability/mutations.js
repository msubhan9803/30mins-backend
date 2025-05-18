import { gql } from 'apollo-server-express';
export const mutations = gql `
  input GroupInput {
    guestIDs: [String]!
  }
  input EditGroupInput {
    guestIDs: [String]!
    name: String
  }

  type Mutation {
    """
    create group  will create the group of max 10 users
    guestIDs: participent in groups
    """
    createGroup(groupData: GroupInput!): Response
    """
    edit group will edit are info of the group
    name: name of group
    ownerID: is one who is creating group
    guestIDs: participent in groups
    """
    editGroup(groupData: EditGroupInput!, documentId: String!): Response
    """
    delete group will delete the group
    documentId: ID of group
    token: user logged in token.
    """
    deleteGroup(documentId: String!): Response
  }
`;
//# sourceMappingURL=mutations.js.map