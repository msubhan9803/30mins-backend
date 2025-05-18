import {gql} from 'apollo-server-express';

export const types = gql`
  enum PUBLIC_ORGANIZATION_FEATURES {
    MEMBERS
    SERVICES
    SIGN_UP
  }

  type Organization {
    _id: String
    restrictionLevel: String
    title: String
    slug: String
    headline: String
    description: String
    image: String
    website: String
    supportEmail: String
    supportPhone: String
    location: String
    socials: SocialsType
    verified: Boolean
    searchTags: [String]
    serviceCategories: [String]
    media: Media
    isPrivate: Boolean
    services: [String]
    members: [String]
    createdAt: String
    publicFeatures: [PUBLIC_ORGANIZATION_FEATURES]
  }

  type MarketerOrgDataResult {
    _id: String
    restrictionLevel: String
    title: String
    slug: String
    headline: String
    description: String
    image: String
    website: String
    supportEmail: String
    supportPhone: String
    location: String
    socials: SocialsType
    verified: Boolean
    searchTags: [String]
    serviceCategories: [String]
    media: Media
    isPrivate: Boolean
    services: [String]
    members: [String]
    createdAt: String
    createdBy: MarketerUserCreatedBy
  }

  type OrganizationWithServiceData {
    _id: String
    restrictionLevel: String
    title: String
    slug: String
    headline: String
    description: String
    image: String
    website: String
    supportEmail: String
    supportPhone: String
    location: String
    socials: SocialsType
    verified: Boolean
    searchTags: [String]
    serviceCategories: [String]
    media: Media
    isPrivate: Boolean
    services: [Service]
    members: [String]
    publicFeatures: [PUBLIC_ORGANIZATION_FEATURES]
  }

  type OrganizationForAdmin {
    _id: String
    createdDate: String
    restrictionLevel: String
    title: String
    slug: String
    headline: String
    description: String
    image: String
    website: String
    supportEmail: String
    supportPhone: String
    location: String
    socials: SocialsType
    verified: Boolean
    searchTags: [String]
    serviceCategories: [String]
    media: Media
    isPrivate: Boolean
    services: [String]
    members: [String]
    publicFeatures: [PUBLIC_ORGANIZATION_FEATURES]
  }

  type OrganizationMembershipData {
    _id: String
    userId: String
    organizationId: Organization
    role: String
  }

  type UserPopulatedMembership {
    _id: String
    userId: PublicUserData
    organizationId: String
    role: String
  }

  type OrganizationDataResponse {
    response: Response
    organizationData: Organization
  }

  type OrganizationServiceDataResponse {
    response: Response
    organizationData: OrganizationWithServiceData
  }
  type UserOrganization {
    response: Response
    OrganizationCount: Int
  }
  type OrganizationsDataResponse {
    response: Response
    organizationData: [Organization]
  }

  type OrganizationsByUserIdResponse {
    response: Response
    membershipData: [OrganizationMembershipData]
  }

  type OrganizationsManagementDetailsResponse {
    response: Response
    membershipData: [OrganizationMembershipData]
  }

  type OrgMemberSearchResponse {
    response: Response
    members: [UserPopulatedMembership]
    memberCount: Int
  }

  type OrgServiceSearchResponse {
    response: Response
    services: [ServiceWithOrgData]
    allOrgTags: [String]
    serviceCount: Int
  }
`;
