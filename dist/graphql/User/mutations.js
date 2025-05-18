import { gql } from 'apollo-server-express';
export const mutations = gql `
  enum AllowedUserAccountTypes {
    provider
    client
  }

  enum AllowedAdminAccountTypes {
    admin
    provider
    client
  }

  input PaymentAccountInput {
    direct: [String]
    escrow: [String]
  }

  input SmsSettingsInput {
    phone: String
    reminders: Boolean
  }

  input UserAccountDetailsInput {
    username: String
    email: String
    password: String
    avatar: String
    createdDate: String
    accountType: AllowedUserAccountTypes
    isIndividual: Boolean
    verifiedAccount: Boolean
    verifiedEmail: Boolean
    privateAccount: Boolean
    acceptedPaymentTypes: [String]
    credentialIDs: [String]
    activeExtensions: [String]
    activeExtensionIDs: [String]
    paymentAccounts: PaymentAccountInput
    stripeAccountId: String
    paypalId: String
    payoneerId: String
    upiId: String
    smsSettings: SmsSettingsInput
  }

  input AdminAccountDetailsInput {
    username: String
    email: String
    avatar: String
    accountType: AllowedAdminAccountTypes
    isIndividual: Boolean
    verifiedAccount: Boolean
    verifiedEmail: Boolean
    privateAccount: Boolean
    acceptedPaymentTypes: [String]
    activeExtensions: [String]
    activeExtensionIDs: [String]
  }

  input PersonalDetailsInput {
    name: String
    description: String
    headline: String
    phone: String
    website: String
    socials: SocialsInput
    searchTags: [String]
    profileMediaLink: String
    profileMediaType: String
    language: LANGUAGES
  }

  input LocationDetailsInput {
    country: String
    timezone: String
    zipCode: String
    latitude: Float
    longitude: Float
  }

  input BillingDetailsInput {
    customerId: String
    fname: String
    lname: String
    address: String
    buildingNumber: String
    city: String
    zipCode: String
    country: String
  }

  input BankDetailsInput {
    bankName: String
    bankAddress: String
    accountNumber: String
    typeAccount: String
    categoryAccount: String
    currencyAccount: String
    SWIFTBIC: String
  }
  input WireDetailsInput {
    nameOnBank: String
    phoneOfBank: String
    addressOfBank: String
    country: String
  }

  input UserInput {
    forTesting: Boolean
    affiliateTeam: String
    welcomeComplete: Boolean
    otpToken: Int
    orgMemberships: [String]
    services: [String]
    publications: [String]
    educationHistory: [String]
    jobHistory: [String]
    bookedMeetings: [String]
    wireDetails: WireDetailsInput
    bankDetails: BankDetailsInput
    accountDetails: UserAccountDetailsInput
    personalDetails: PersonalDetailsInput
    locationDetails: LocationDetailsInput
    billingDetails: BillingDetailsInput
  }

  input AdminUserInput {
    forTesting: Boolean
    welcomeComplete: Boolean
    affiliateTeam: String
    isMarketer: Boolean
    orgMemberships: [String]
    services: [String]
    publications: [String]
    educationHistory: [String]
    jobHistory: [String]
    bookedMeetings: [String]
    accountDetails: AdminAccountDetailsInput
    personalDetails: PersonalDetailsInput
    locationDetails: LocationDetailsInput
  }

  input WelcomeInput {
    name: String
    username: String
    timezone: String
    zipCode: String
    country: String
    welcomeComplete: Boolean
  }

  input AvailabilityInput {
    start: Int
    end: Int
  }

  input DayInput {
    isActive: Boolean
    availability: [AvailabilityInput]
  }

  input WorkingHoursInput {
    startTime: Int
    endTime: Int
    isCustomEnabled: Boolean
    monday: DayInput
    tuesday: DayInput
    wednesday: DayInput
    thursday: DayInput
    friday: DayInput
    saturday: DayInput
    sunday: DayInput
  }

  type ValidateOtpResponse {
    email: String
    name: String
    response: Response
  }
  type AdminDeleteResponse {
    response: Response
    userIDs: [String]
  }

  type Mutation {
    updateUserWelcome(userData: WelcomeInput, token: String!): Response
    updateUser(userData: UserInput, token: String!): Response
    makeAffiliateUser(affiliateTeam: String!, username: String!): Response
    adminUpdateUser(userData: AdminUserInput, token: String!, documentId: String!): Response
    backendUpdateUser(userData: AdminUserInput, email: String!): Response
    handleSignIn(email: String!, name: String!, referralId: String): Response
    handleOtpSignUp(email: String!, name: String!): Response
    handleSMSSignUp(email: String!, name: String!): Response
    handleSMSSignIn(email: String!, name: String!): Response
    makeUserVerified(username: String!): Response
    resetWelcomeProcess(username: String!): Response
    handleOtpSignIn(email: String!): Response
    handleEmailChange(email: String!): Response
    validateOtp(email: String!, otpToken: String!): ValidateOtpResponse
    updateWorkingHours(workingHours: WorkingHoursInput!, token: String!): Response
    deleteUser(token: String!): Response
    adminDeleteUser(token: String!, documentId: String!): Response
    adminDeleteUsers(userIDs: [String]!): AdminDeleteResponse!
    generateInviteLink(token: String!, inviteeEmail: String!, inviteeName: String!): Response
    updateLastSeen: UserLastSeen
    marketerCreateUser(userData: UserInput): Response
    marketerDeleteUser(userEmail: String!): Response
    sendSmsOtp(phone: String!): Response
    validateSmsOtp(phone: String!, otpToken: String!, forProviderExtension: Boolean!): Response
    updatePaymentMethods(escrow: [String], direct: [String]): Response
  }
`;
//# sourceMappingURL=mutations.js.map