import { gql } from 'apollo-server-express';
export const types = gql `
  type Availability {
    start: Int
    end: Int
  }
  enum SERVICE_TYPES {
    FULL_TIME_JOB
    FREELANCING_WORK
    MEETING
    ROUND_ROBIN
  }
  type Day {
    isActive: Boolean
    availability: [Availability]
  }
  type EmailFilter {
    type: BW_LIST
    emails: [String]
    domains: [String]
  }

  type Filter {
    emails: [String]
    domains: [String]
  }

  type serviceWorkingHours {
    isCustomEnabled: Boolean
    monday: Day
    tuesday: Day
    wednesday: Day
    thursday: Day
    friday: Day
    saturday: Day
    sunday: Day
  }

  type BookingQuestions {
    questionType: String
    required: Boolean
    question: String
    options: [String]
  }

  type Service {
    _id: String
    image: String
    userId: User
    organizationId: String
    organizationName: String
    orgServiceCategory: String
    isOrgService: Boolean
    title: String
    slug: String
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
    media: Media
    paymentType: String
    isPaid: Boolean
    hasReminder: Boolean
    isRecurring: Boolean
    serviceWorkingHours: serviceWorkingHours
    bookingQuestions: [BookingQuestions]
    blackList: Filter
    whiteList: Filter
    serviceType: SERVICE_TYPES
    attendeeLimit: Int
    dueDate: Int
    otpProtected: Boolean
    authenticationType: String
  }

  type ServiceWithOrgData {
    _id: String
    image: String
    userId: User
    organizationId: Organization
    organizationName: String
    orgServiceCategory: String
    isOrgService: Boolean
    title: String
    slug: String
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
    media: Media
    paymentType: String
    isPaid: Boolean
    hasReminder: Boolean
    isRecurring: Boolean
    serviceWorkingHours: serviceWorkingHours
    bookingQuestions: [BookingQuestions]
    blackList: Filter
    whiteList: Filter
    serviceType: SERVICE_TYPES
    attendeeLimit: Int
    dueDate: String
    otpProtected: Boolean
    authenticationType: String
  }

  type RoundRobinService {
    _id: String
    image: String
    userId: PublicUserData
    organizationId: Organization
    organizationName: String
    orgServiceCategory: String
    isOrgService: Boolean
    title: String
    slug: String
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
    media: Media
    paymentType: String
    isPaid: Boolean
    hasReminder: Boolean
    isRecurring: Boolean
    serviceWorkingHours: serviceWorkingHours
    bookingQuestions: [BookingQuestions]
    blackList: Filter
    whiteList: Filter
    serviceType: SERVICE_TYPES
    roundRobinTeam: RoundRobinTeam
    otpProtected: Boolean
    authenticationType: String
  }
  type ServiceDataResponse {
    response: Response
    serviceData: Service
  }

  # Multiple
  type ServicesDataResponse {
    response: Response
    serviceData: [Service]
  }
  type AdminServicesDataResponse {
    response: Response
    serviceData: [Service]
    serviceCount: Int
  }
`;
//# sourceMappingURL=types.js.map