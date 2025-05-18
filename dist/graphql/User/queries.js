import { gql } from 'apollo-server-express';
export const queries = gql `
  input UserSearchParams {
    keywords: String
    location: String
    isIndividual: Boolean
    pageNumber: Int!
    resultsPerPage: Int!
    orgs: Boolean
    srvs: Boolean
    usrs: Boolean
    events: Boolean
  }

  input AdminUserSearchParams {
    keywords: String
    isIndividual: Boolean
    isAffiliate: Boolean
    pageNumber: Int!
    resultsPerPage: Int!
  }

  type OtpEmailResponse {
    emailHint: String
    hasAccount: Boolean
    response: Response
  }

  type SentJoinInvite {
    _id: String
    inviteeEmail: String
  }

  type SentJoinInvitesResponse {
    response: Response
    pendingInvites: [SentJoinInvite]
  }

  type AccountDetailsForSeo {
    avatar: String
    username: String
  }

  type PersonalDetailsForSeo {
    description: String
  }

  type UserForSeo {
    accountDetails: AccountDetailsForSeo
    personalDetails: PersonalDetailsForSeo
  }

  type UserSeoResponse {
    response: Response
    userCount: Int
    userData: [UserForSeo]
  }
  input MarketerSearchParams {
    keywords: String
    pageNumber: Int!
    resultsPerPage: Int!
    searchType: String!
  }

  type MarketerResultsResponse {
    response: Response
    returnDataCount: Int
    returnUserData: [MarketerUserDataResult]
    returnOrgData: [MarketerOrgDataResult]
  }
  type LastWarningSentResponse {
    sendEmail: Boolean
    response: Response
  }

  type RevenueDataObject {
    _id: String
    totalRevenue: Float
  }

  type OrgSignup {
    organizationTitle: String
    count: Int
  }

  type UserDashboardData {
    hasPaidService: Boolean
    totalRevenueData: [RevenueDataObject]
    orgSignups: [OrgSignup]
    response: Response
  }
  type PaymentOptionsData {
    escrowServices: Int
    directServices: Int
    response: Response
  }

  type Query {
    getUserById(token: String!): UserDataResponse
    getUserDashboardData(token: String!): UserDashboardData
    getPaymentOptionsData(token: String!): PaymentOptionsData
    getUserByCode(code: String!): OtpEmailResponse
    getUserByUsername(username: String!): UserDataResponse
    getlastWarningSent(email: String!): LastWarningSentResponse
    getPublicUserData(username: String!): PublicUserDataResponse
    getUserSearchResults(userSearchParams: UserSearchParams): UserSearchResultsResponse
    getUsersForAdmin(userSearchParams: AdminUserSearchParams, token: String!): AdminSearchResponse
    getUserForAdmin(token: String!, documentId: String!): UserDataResponse
    getUsersCount(token: String!): UserCountData
    getSentJoinInvites(token: String!): SentJoinInvitesResponse
    """
    This will check If User exists with given email, and also verifies if user has the calendar or not.
    Input: email
    Output: hasCalendar , userExists , response
    """
    checkUserEmailAndCalendar(email: String!): CheckUserEmailAndCalenderResponse
    getUsersWithAdvertisingExtension: PublicUserExtensionsResponse
    getUsersForSeo(resultsPerBatch: Int!, batchNumber: Int!): UserSeoResponse
    getUserAndOrganizationSearchResults(
      searchParams: UserSearchParams
    ): UserAndOrganizationSearchResultsResponse
    getUserForStartConversation(keyword: String): PublicUserDataResponse
    getLastSeenOfUser(email: String): UserLastSeen
    checkVerifiedStatus(email: String): Response
    getResultsForMarketer(searchParams: MarketerSearchParams): MarketerResultsResponse
  }
`;
//# sourceMappingURL=queries.js.map