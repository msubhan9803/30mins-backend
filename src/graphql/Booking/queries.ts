import {gql} from 'apollo-server-express';

export const queries = gql`
  input BookingSearchParams {
    pageNumber: Int!
    resultsPerPage: Int!
    isProvider: Boolean!
    serviceType: SERVICE_TYPES
    month: Int
    year: Int
  }

  input BookingSearchParamsAllUpComing {
    isProvider: Boolean!
    serviceType: SERVICE_TYPES
  }

  input PendingPayoutSearchParams {
    pageNumber: Int!
    resultsPerPage: Int!
    showReleased: Boolean!
  }
  input AdminBookingParams {
    pageNumber: Int!
    resultsPerPage: Int!
    keywords: String
  }

  type BookingAvailabilityResponse {
    availableSlots: [String]
    response: Response
  }

  type WeekdayAvailabilityResponse {
    availableWeekdays: [Int]
    response: Response
  }

  type CollectiveRRAvailabilityResponse {
    teamsAvailability: [TeamsAvailability]
    collectiveAvailability: [String]
    response: Response
  }
  type TeamsAvailability {
    availability: [String]
    user: PublicUserData
    priority: Int
  }
  type accountDetails {
    username: String
  }

  type recurringAvailability {
    isAvailable: Boolean
    availabilities: [String]
    response: Response
  }

  type preApprovedUserResponse {
    response: Response
    approved: Boolean
    dayPassed: Boolean
    approvalRequested: Boolean
  }
  type Query {
    getBookings(token: String!, searchParams: BookingSearchParams): BookingSearchDataResponse
    getAllUpComingBookings(
      token: String!
      searchParams: BookingSearchParamsAllUpComing
    ): BookingSearchDataResponse
    getPendingPayouts(
      token: String!
      searchParams: PendingPayoutSearchParams
    ): PendingPayoutSearchDataResponse
    getBookingById(token: String, documentId: String!): BookingDataResponse
    getBookingsForAdmin(token: String!, searchParams: AdminBookingParams): BookingSearchDataResponse
    "Checks against the Provider User's Blacklist/Whitelist Service Settings - Returns a 401 Status Code if Email should be blocked - 200 Otherwise"
    checkEmailFilter(serviceID: String!, bookerEmail: String!, providerID: String!): Response
    """
    This will return number of slot booked of particular service of specific time interval
    """
    getCurrentSlotBookings(
      serviceID: String!
      startTime: String
      endTime: String
    ): BookingSlotCountResponse

    """
    Returns an array of timeslots for start-times in UTC for when the Provider is available during the day selected
    """
    getAvailability(
      serviceID: String!
      daySelected: String!
      bookerTimezone: String!
    ): BookingAvailabilityResponse
    """
    Returns an array of weekday integers (0 = Sunday - 6 = Saturday) for weekdays when the Provider is available in the Booker's timezone
    """
    getWeekdayAvailability(serviceID: String!, bookerTimezone: String!): WeekdayAvailabilityResponse

    getRRAvailability(
      serviceID: String!
      daySelected: String!
      bookerTimezone: String!
    ): CollectiveRRAvailabilityResponse
    """
    checks whether the provider is available for meetingCounts
    """
    checkRecurringAvailability(
      providerUsername: String!
      initialBookingDateTime: String!
      meetingCount: Int!
    ): recurringAvailability

    getStatusAuthCode(bookingId: String, email: String, authCode: String): StatusAuthCodeResponse!

    getPreApprovedUsers(
      serviceID: String!
      bookerEmail: String!
      providerEmail: String!
    ): preApprovedUserResponse
  }
`;
