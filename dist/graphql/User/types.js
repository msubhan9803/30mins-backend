import { gql } from 'apollo-server-express';
export const types = gql `
  enum LANGUAGES {
    ENGLISH
    ESPANOL
    ITALIAN
    PORTUGUESE
    ROMANIAN
    GERMAN
  }

  type SmsSettings {
    phone: String
    reminders: Boolean
  }

  type AccountDetails {
    username: String
    email: String
    password: String
    avatar: String
    profileBackground: String
    createdDate: String
    isIndividual: Boolean
    accountType: String
    verifiedAccount: Boolean
    verifiedEmail: Boolean
    privateAccount: Boolean
    credentialIDs: [String]
    acceptedPaymentTypes: [String]
    allowedConferenceTypes: [String]
    activeExtensions: [String]
    activeExtensionIDs: [String]
    paymentAccounts: PaymentAccountType
    stripeAccountId: String
    paypalId: String
    payoneerId: String
    upiId: String
    smsSettings: SmsSettings
  }
  type UserSmsSettings {
    phone: String
    reminders: Boolean
  }

  type PublicAccountDetails {
    username: String
    email: String
    avatar: String
    createdDate: String
    isIndividual: Boolean
    accountType: String
    verifiedAccount: Boolean
    verifiedEmail: Boolean
    privateAccount: Boolean
    acceptedPaymentTypes: [String]
    allowedConferenceTypes: [String]
    activeExtensions: [String]
    paymentAccounts: PaymentAccountType
    stripeAccountId: String
    paypalId: String
    payoneerId: String
    upiId: String
    smsSettings: UserSmsSettings
  }
  type UserPublicAccountDetails {
    accountDetails: PublicAccountDetails
    personalDetails: PersonalDetails
  }

  type PersonalDetails {
    name: String
    description: String
    headline: String
    phone: String
    website: String
    socials: SocialsType
    searchTags: [String]
    profileMediaLink: String
    profileMediaType: String
    language: LANGUAGES
  }

  type LocationDetails {
    country: String
    timezone: String
    zipCode: String
    latitude: Float
    longitude: Float
  }

  type PublicLocationDetails {
    country: String
    timezone: String
  }

  type PublicExtensionsAccountDetails {
    activeExtensions: [String]
  }

  type PaymentAccountType {
    direct: [String]
    escrow: [String]
  }

  type BillingDetails {
    customerId: String
    fname: String
    lname: String
    address: String
    buildingNumber: String
    city: String
    zipCode: String
    country: String
  }

  type Availability {
    start: Int
    end: Int
  }

  type Day {
    isActive: Boolean
    availability: [Availability]
  }

  type WorkingHours {
    startTime: Int
    endTime: Int
    isCustomEnabled: Boolean
    monday: Day
    tuesday: Day
    wednesday: Day
    thursday: Day
    friday: Day
    saturday: Day
    sunday: Day
  }

  type BankDetails {
    bankName: String
    bankAddress: String
    accountNumber: String
    typeAccount: String
    categoryAccount: String
    currencyAccount: String
    SWIFTBIC: String
  }
  type WireDetails {
    nameOnBank: String
    phoneOfBank: String
    addressOfBank: String
    country: String
  }

  type User {
    _id: String
    forTesting: Boolean
    isMarketer: Boolean
    couponCode: String
    welcomeComplete: Boolean
    otpToken: Int
    orgMemberships: [String]
    services: [String]
    publications: [String]
    educationHistory: [String]
    jobHistory: [String]
    bookedMeetings: [String]
    accountDetails: AccountDetails
    personalDetails: PersonalDetails
    locationDetails: LocationDetails
    billingDetails: BillingDetails
    workingHours: WorkingHours
    wireDetails: WireDetails
    bankDetails: BankDetails
    lastSeen: String
    createdAt: String
  }

  type PublicUserData {
    welcomeComplete: Boolean
    accountDetails: PublicAccountDetails
    lastWarningSent: String
    couponCode: String
    personalDetails: PersonalDetails
    publications: [Publication]
    jobHistory: [JobHistory]
    educationHistory: [EducationHistory]
    services: [Service]
    events: [Event]
    locationDetails: PublicLocationDetails
    workingHours: WorkingHours
    createdAt: String
  }

  type MarketerUserCreatedBy {
    accountDetails: PublicAccountDetails
  }

  type MarketerUserDataResult {
    welcomeComplete: Boolean
    accountDetails: PublicAccountDetails
    couponCode: String
    personalDetails: PersonalDetails
    publications: [Publication]
    jobHistory: [JobHistory]
    educationHistory: [EducationHistory]
    services: [Service]
    locationDetails: PublicLocationDetails
    workingHours: WorkingHours
    createdAt: String
    createdBy: MarketerUserCreatedBy
  }

  type UserLastSeen {
    lastSeen: String
    online: Boolean
    accountDetails: PublicAccountDetails
    response: Response
  }
  type PublicUserExtensionsPersonalDetails {
    name: String
  }

  type PublicUserExtensionsAccountDetails {
    username: String
  }

  type PublicUserExtensions {
    personalDetails: PublicUserExtensionsPersonalDetails
    accountDetails: PublicUserExtensionsAccountDetails
  }

  type UserDataResponse {
    response: Response
    userData: User
    test: String
  }
  type UserCountData {
    response: Response
    usercount: Int
    welcomeData: Int
  }

  type CheckUserEmailAndCalenderResponse {
    guestID: String
    userExists: Boolean
    hasCalendar: Boolean
    response: Response
  }
  type AdminSearchResponse {
    response: Response
    userData: [User]
    userCount: Int
  }

  type PublicUserDataResponse {
    response: Response
    userData: PublicUserData
  }

  type PublicUserExtensionsResponse {
    response: Response
    userData: [PublicUserExtensions]
  }

  type UserSearchResultsResponse {
    response: Response
    userData: [PublicUserData]
    userCount: Int
  }

  type UserAndOrganizationSearchResultsResponse {
    response: Response
    userData: [PublicUserData]
    userCount: Int
    organizationData: [Organization]
    organizationCount: Int
    serviceData: [ServiceWithOrgData]
    serviceCount: Int
    eventData: [Event]
    eventsCount: Int
  }
`;
//# sourceMappingURL=types.js.map