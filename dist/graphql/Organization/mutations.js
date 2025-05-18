import { gql } from 'apollo-server-express';
export const mutations = gql `
  enum AllowedRestrictionLevels {
    "Any User Can Join"
    OPEN
    "Requires Invite to Join"
    RESTRICTED
    "No New Users Can Join"
    LOCKED
  }

  "**Input Type Matching Organization MongoDB Schema**"
  input OrganizationInput {
    "Set the Join Restrictions of the Organization"
    restrictionLevel: AllowedRestrictionLevels
    title: String
    slug: String
    headline: String
    description: String
    image: String
    website: String
    supportEmail: String
    supportPhone: String
    location: String
    socials: SocialsInput
    verified: Boolean
    searchTags: [String]
    media: MediaInput
    isPrivate: Boolean
    publicFeatures: [PUBLIC_ORGANIZATION_FEATURES]
  }

  enum AllowedRoles {
    owner
    admin
    member
  }

  type Mutation {
    createOrganization(organizationData: OrganizationInput, token: String!): Response
    adminCreateOrganization(organizationData: OrganizationInput, ownerEmail: String!): Response
    editOrganization(
      organizationData: OrganizationInput
      documentId: String!
      token: String!
    ): Response
    deleteOrganization(documentId: String!, token: String!): Response
    addOrganizationMember(token: String!, organizationId: String!): Response
    editOrganizationMemberRole(
      token: String!
      organizationId: String!
      organizationMembershipId: String!
      role: AllowedRoles!
    ): Response
    kickOrganizationMember(
      token: String!
      organizationMembershipId: String!
      organizationId: String!
      kickReason: String
    ): Response
    addOrganizationServiceCategory(
      token: String!
      organizationId: String!
      categoryData: String!
    ): Response
    removeOrganizationServiceCategory(
      token: String!
      organizationId: String!
      categoryData: String!
    ): Response
    leaveOrganization(token: String!, organizationId: String!): Response
    createPendingInvite(
      token: String!
      inviteeEmail: String!
      organizationId: String!
      organizationTitle: String!
      language: LANGUAGES
    ): Response
    acceptPendingInvite(token: String!, organizationId: String!, pendingInviteId: String!): Response
    deletePendingInvite(token: String!, organizationId: String!, documentId: String!): Response
    declinePendingInvite(
      token: String!
      organizationId: String!
      pendingInviteId: String!
    ): Response
    createPendingJoinRequest(token: String!, organizationId: String!): Response
    acceptPendingJoinRequest(token: String!, pendingRequestId: String!): Response
    declinePendingJoinRequest(token: String!, pendingRequestId: String!): Response
    linkUserToOrganization(organizationTitle: String!, userEmail: String!): Response
    adminDeleteOrganization(documentId: String!): Response

    "Restricted to Admin only: Allows Admin Users to Edit an Organization using the organizationData provided"
    adminEditOrganization(
      "Data used to update the Organization Document"
      organizationData: OrganizationInput
      "Document ID of the Organization to Edit"
      documentId: String!
    ): Response

    marketerCreateOrganization(organizationData: OrganizationInput): Response
    marketerDeleteOrganization(organizationTitle: String!): Response
  }
`;
//# sourceMappingURL=mutations.js.map