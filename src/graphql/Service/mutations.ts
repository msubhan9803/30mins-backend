import {gql} from 'apollo-server-express';

export const mutations = gql`
  enum BW_LIST {
    BLACK_LIST
    WHITE_LIST
  }
  enum SERVICE_TYPES {
    FULL_TIME_JOB
    PART_TIME_JOB
    FREELANCING_WORK
    MEETING
  }

  enum PAYMENT_TYPES {
    direct
    escrow
    manual
    none
  }

  input FilterInput {
    emails: [String]
    domains: [String]
  }

  input AvailabilityInput {
    start: Int
    end: Int
  }

  input DayInput {
    isActive: Boolean
    availability: [AvailabilityInput]
  }

  input serviceWorkingHoursInput {
    isCustomEnabled: Boolean
    monday: DayInput
    tuesday: DayInput
    wednesday: DayInput
    thursday: DayInput
    friday: DayInput
    saturday: DayInput
    sunday: DayInput
  }

  input availabilityRangeInput {
    start: String
    end: String
  }
  input availabilityDayInput {
    isActive: Boolean
    availability: [availabilityRangeInput]
  }

  input serviceAvailabilityInput {
    isCustomEnabled: Boolean
    monday: availabilityDayInput
    tuesday: availabilityDayInput
    wednesday: availabilityDayInput
    thursday: availabilityDayInput
    friday: availabilityDayInput
    saturday: availabilityDayInput
    sunday: availabilityDayInput
  }

  input ServiceInput {
    title: String
    slug: String
    image: String
    description: String
    duration: Int
    isPrivate: Boolean
    price: Int
    currency: String
    percentDonated: Int
    charity: String
    charityId: String
    reminders: [String]
    recurringInterval: String
    conferenceType: [String]
    searchTags: [String]
    media: MediaInput
    paymentType: PAYMENT_TYPES
    isPaid: Boolean
    hasReminder: Boolean
    isRecurring: Boolean
    serviceWorkingHours: serviceWorkingHoursInput
    bookingQuestions: [BookingQuestionInput]
    blackList: FilterInput
    whiteList: FilterInput
    serviceType: SERVICE_TYPES
    attendeeLimit: Int
    dueDate: Int
    otpProtected: Boolean
    authenticationType: SERVICE_AUTH_TYPE
  }

  input BookingQuestionInput {
    questionType: String
    required: Boolean
    question: String
    options: [String]
  }

  input OrganizationServiceInput {
    organizationName: String!
    organizationId: String!
    orgServiceCategory: String!
    title: String
    slug: String
    image: String
    description: String
    duration: Int
    isPrivate: Boolean
    price: Int
    currency: String
    percentDonated: Int
    charity: String
    charityId: String
    reminders: [String]
    recurringInterval: String
    conferenceType: [String]
    searchTags: [String]
    media: MediaInput
    paymentType: PAYMENT_TYPES
    isPaid: Boolean
    hasReminder: Boolean
    isRecurring: Boolean
    isOrgService: Boolean
    serviceWorkingHours: serviceWorkingHoursInput
    bookingQuestions: [BookingQuestionInput]
    blackList: FilterInput
    whiteList: FilterInput
    serviceType: SERVICE_TYPES
    attendeeLimit: Int
    otpProtected: Boolean
    authenticationType: SERVICE_AUTH_TYPE
  }
  input RoundRobinServiceInput {
    organizationName: String!
    organizationId: String!
    orgServiceCategory: String!
    title: String
    slug: String
    image: String
    description: String
    duration: Int
    isPrivate: Boolean
    price: Int
    currency: String
    percentDonated: Int
    charity: String
    reminders: [String]
    recurringInterval: String
    conferenceType: [String]
    searchTags: [String]
    media: MediaInput
    paymentType: PAYMENT_TYPES
    isPaid: Boolean
    hasReminder: Boolean
    isRecurring: Boolean
    isOrgService: Boolean
    serviceWorkingHours: serviceWorkingHoursInput
    bookingQuestions: [BookingQuestionInput]
    blackList: FilterInput
    whiteList: FilterInput
    roundRobinTeam: String
    otpProtected: Boolean
    authenticationType: SERVICE_AUTH_TYPE
  }

  type Mutation {
    createService(serviceData: ServiceInput, token: String!): Response
    editService(serviceData: ServiceInput, documentId: String!, token: String!): Response
    backendEditService(serviceData: ServiceInput, serviceId: String!, userId: String!): Response
    deleteService(documentId: String!, token: String!): Response
    createOrganizationService(
      organizationServiceData: OrganizationServiceInput
      token: String!
    ): Response
    editOrganizationService(
      organizationServiceData: OrganizationServiceInput
      documentId: String!
      token: String!
    ): Response
    deleteOrganizationService(documentId: String!, token: String!): Response
    """
    Don't need to give the service type becasue
    Service Type is set to ROUND_ROBIN
    RoundRobinTeam will the id of RoundRobin Team.
    """
    createOrgRoundRobinService(roundRobinServiceData: RoundRobinServiceInput): Response
    """
    Edit the Round Robin Service
    documentId :Id of service
    roundRobinData: update data of round robin service
    """
    editOrgRoundRobinService(
      roundRobinServiceData: RoundRobinServiceInput
      documentId: String
    ): Response
    """
    Edit the Round Robin Service
    documentId :Id of service
    organizationId : id Of organization
    """
    deleteOrgRoundRobinService(documentId: String, organizationId: String): Response
    """
    Assign Team to Round Robin service
    serviceId: Id Of service
    roundRobinTeamId:id of Round Robin team
    organizationId : id Of organization
    """
    assignRoundRobinTeamToService(
      serviceId: String
      roundRobinTeamId: String
      organizationId: String
    ): Response
    """
    Remove Team form Round Robin service
    serviceId from which team will be removed
    organizationId : id Of organization
    """
    removeRoundRobinTeamFromService(serviceId: String, organizationId: String): Response
  }
`;
