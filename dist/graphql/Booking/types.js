import { gql } from 'apollo-server-express';
export const types = gql `
  type StatusType {
    clientConfirmed: Boolean
    clientCanceled: Boolean
    providerConfirmed: Boolean
    providerCanceled: Boolean
    providerDeclined: Boolean
    refundRequested: Boolean
    refunded: Boolean
    hasOpenReport: Boolean
    reportReason: String
    postMeetingNotes: String
    postMeetingFeedback: String
    refundRequestReason: String
    paymentReleased: Boolean
  }

  type AnsweredQuestion {
    questionType: String
    question: String
    answer: String
    selectedOptions: [String]
  }

  type Booking {
    _id: String
    provider: String
    booker: String
    dateBooked: String
    meetingCount: Int
    bookerName: String
    bookerEmail: String
    providerName: String
    providerEmail: String
    bookerPhone: String
    bookerTimeZone: String
    ccRecipients: [String]
    additionalNotes: String
    price: Int
    currency: String
    paymentType: String
    paymentAccount: String
    paymentStatus: String
    meetingDate: String
    percentDonated: Int
    charity: String
    title: String
    subject: String
    conferenceType: String
    startTime: String
    endTime: String
    meetingDuration: Int
    status: StatusType
    serviceID: ID
    confirmed: Boolean
    answeredQuestions: [AnsweredQuestion]
    googleCalendarEvent: GoogleEventType
    officeCalendarEvent: OfficeEventType
    serviceType: String
    createdAt: String
  }

  type GoogleEventType {
    googleCalender: Boolean
    googleCalendarEventId: String
  }

  type OfficeEventType {
    office365Calendar: Boolean
    office365CalendarEventId: String
  }

  type BookingSlotCountResponse {
    response: Response
    numOfBookedSlot: Int
  }

  type BookingSearchDataResponse {
    response: Response
    bookingData: [Booking]
    bookingCount: Int
  }

  type PayoutMethod {
    payoutType: String
    payoutId: String
  }

  type PendingPayout {
    _id: String
    providerEmail: String
    providerPayoutMethod: PayoutMethod
    bookerEmail: String
    amountToRelease: Float
    bookingId: String
    status: String
    dateReleased: String
  }

  type PendingPayoutSearchDataResponse {
    response: Response
    payoutData: [PendingPayout]
    payoutCount: Int
  }

  type BookingDataResponse {
    response: Response
    bookingData: Booking
  }
  type BookingRequest {
    provider: String
    booker: String
    service: String
    approved: String
    authcode: String
    used: String
  }

  type StatusAuthCodeResponse {
    response: Response
    statusAuthCode: StatusAuthCode
  }

  type StatusAuthCode {
    id: ID!
    email: String!
    bookingId: ID!
    authCode: String!
    availableStatus: [String!]!
    expireAt: String!
    used: Boolean!
  }
`;
//# sourceMappingURL=types.js.map