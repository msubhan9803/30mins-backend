import {gql} from 'apollo-server-express';

export const queries = gql`
  input OrgMemberSearchParams {
    keywords: String
    pageNumber: Int!
    resultsPerPage: Int!
  }

  input OrgServiceSearchParams {
    keywords: String
    isPaid: Boolean
    pageNumber: Int!
    searchTags: [String]
    resultsPerPage: Int!
  }

  input OrgSearchParams {
    keywords: String
    location: String
    pageNumber: Int!
    resultsPerPage: Int!
  }

  type PendingInvite {
    _id: String
    inviteeUserId: String
    inviteeEmail: String
    organizationId: Organization
  }

  type PendingInviteForOrg {
    _id: String
    inviteeUserId: PublicUserData
    inviteeEmail: String
    organizationId: Organization
  }

  type PendingInvitesResponse {
    response: Response
    pendingInvites: [PendingInvite]
  }

  type PendingInvitesForOrgResponse {
    response: Response
    pendingInvites: [PendingInviteForOrg]
  }

  type PendingJoinRequest {
    _id: String
    requesterUserId: PublicUserData
    organizationId: String
  }

  type PendingJoinRequestsResponse {
    response: Response
    pendingJoinRequests: [PendingJoinRequest]
  }

  type MembershipResponse {
    response: Response
    membership: OrganizationMembershipData
  }

  type OrganizationSearchResponse {
    response: Response
    organizationData: [Organization]
    organizationCount: Int
  }

  type AdminOrganizationResponse {
    response: Response
    organizationData: [OrganizationForAdmin]
    organizationCount: Int
  }

  type OrganizationForSeo {
    title: String
    slug: String
    image: String
    description: String
  }

  type OrganizationSeoResponse {
    response: Response
    organizationData: [OrganizationForSeo]
    organizationCount: Int
  }

  input ReferralSearchParams {
    organizationId: String
    pageNumber: Int
    resultsPerPage: Int
    month: Int
    year: Int
  }

  type ReferralUsersResponse {
    usersData: [User]
    totalRecords: Int
    response: Response
  }

  type Query {
    getOrganizationsByTitle(title: String!): OrganizationsDataResponse
    getOrganizationBySlug(slug: String!): OrganizationServiceDataResponse
    getOrganizationsByUserId(token: String!): OrganizationsByUserIdResponse
    getOrganizationCounts(token: String!): UserOrganization
    getOrganizationManagementDetails(token: String!): OrganizationsManagementDetailsResponse
    getOrganizationMembersById(
      token: String!
      documentId: String!
      searchParams: OrgMemberSearchParams!
    ): OrgMemberSearchResponse
    getOrganizationServiceResults(
      documentId: String!
      searchParams: OrgServiceSearchParams!
    ): OrgServiceSearchResponse
    getOrganizationMemberResults(
      documentId: String!
      searchParams: OrgMemberSearchParams!
    ): UserSearchResultsResponse
    getPendingInvitesByUserId(token: String!): PendingInvitesResponse
    getPendingJoinRequestsByUserId(token: String!): PendingJoinRequestsResponse
    getPendingJoinRequestsByOrgId(
      token: String!
      organizationId: String!
    ): PendingJoinRequestsResponse
    getPendingInvitesByOrgId(token: String!, organizationId: String!): PendingInvitesForOrgResponse
    getOrganizationMembership(token: String!, organizationId: String!): MembershipResponse
    "Restricted to Admin only: Allows Admin Users to Get an Organizations Data - Session Token Authorization Header Required"
    getOrganizationById(
      "Document ID of the Organization to Query"
      organizationId: String!
    ): OrganizationDataResponse
    getOrganizationSearchResults(orgSearchParams: OrgSearchParams): OrganizationSearchResponse
    getOrganizationsForAdmin(orgSearchParams: OrgSearchParams): AdminOrganizationResponse
    getOrganizationsForSeo(resultsPerBatch: Int!, batchNumber: Int!): OrganizationSeoResponse
    getReferralUsersByOrganizationId(
      searchParams: ReferralSearchParams
      token: String
    ): ReferralUsersResponse
  }
`;
