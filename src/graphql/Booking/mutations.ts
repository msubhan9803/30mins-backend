import {gql} from 'apollo-server-express';

export const mutations = gql`
  input StatusInput {
    clientConfirmed: Boolean
    clientCanceled: Boolean
    providerConfirmed: Boolean
    providerCanceled: Boolean
    providerDeclined: Boolean
    refundRequested: Boolean
    refundRequestReason: String
    refunded: Boolean
    hasOpenReport: Boolean
    reportReason: String
    postMeetingNotes: String
    postMeetingFeedback: String
    paymentReleased: Boolean
  }
  input StatusUpdateInput {
    bookingId: String
    clientConfirmed: Boolean
    clientCanceled: Boolean
    providerConfirmed: Boolean
    providerCanceled: Boolean
    providerDeclined: Boolean
    refundRequested: Boolean
    refundRequestReason: String
    refunded: Boolean
    hasOpenReport: Boolean
    reportReason: String
    postMeetingNotes: String
    postMeetingFeedback: String
    paymentStatus: String
    paymentReleased: Boolean
  }

  input BookingSmsSetting {
    phone: String
    reminders: Boolean
  }

  input BookingSmsSettings {
    bookerSms: BookingSmsSetting
    providerSms: BookingSmsSetting
  }

  input BookingDataInput {
    captchaToken: String
    providerUsername: String
    dateBooked: String
    bookerName: String
    bookerEmail: String
    bookerLanguage: LANGUAGES
    providerName: String
    providerEmail: String
    bookerPhone: String
    bookerTimeZone: String
    ccRecipients: [String]
    additionalNotes: String
    meetingCount: Int
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
    reminders: [String]
    status: StatusInput
    serviceID: String
    serviceType: SERVICE_TYPES
    chargeID: String
    answeredQuestions: [answeredQuestionsInput]
    smsSettings: BookingSmsSettings
  }
  input answeredQuestionsInput {
    questionType: String
    question: String
    answer: String
    selectedOptions: [String]
  }

  type BookMeetingResponse {
    response: Response
    bookingId: String
    providerLanguage: String
    bookerLanguage: String
  }

  type resheduleResponse {
    response: Response
    meetingLink: String
  }

  type ConfirmationDataResponse {
    response: Response
    bookingData: Booking
    providerUser: User
    serviceData: Service
  }

  input CalendarEvents {
    google: GoogleEvent
    office: OfficeEvent
  }

  input GoogleEvent {
    googleCalender: Boolean
    googleCalendarEventId: String
  }

  input OfficeEvent {
    office365Calendar: Boolean
    office365CalendarEventId: String
  }
  type BookingRequestResponse {
    authcode: String
    response: Response
  }
  type VerifyRequestResponse {
    approved: Boolean
    dayPassed: Boolean
    response: Response
  }

  type RequestBookingActionResponse {
    approved: Boolean
    providerName: String
    bookerName: String
    providerEmail: String
    bookerEmail: String
    response: Response
  }

  type AuthResponse {
    authCode: StatusAuthCode
    response: Response
  }

  input StatusAuthCodeInput {
    email: String!
    bookingId: String!
    availableStatus: [String!]!
    expireAt: String!
  }

  type Mutation {
    bookMeeting(bookingData: BookingDataInput): BookMeetingResponse
    createPendingMeeting(bookingData: BookingDataInput): BookMeetingResponse
    updateBookingStatus(userId: String, statusUpdateData: StatusUpdateInput): Response
    confirmMeeting(documentId: String!, chargeID: String!): ConfirmationDataResponse
    updateCalendarEventIds(bookingId: String, events: CalendarEvents): Response
    addStatusAuthCode(input: StatusAuthCodeInput!): AuthResponse
    updateStatusAuthCode(id: String!): Response
    rescheduleMeeting(
      meetingId: String
      selectedTime: String
      rescheduleMeetingReason: String
    ): resheduleResponse
    requestBookingApprovals(
      serviceId: String!
      bookerEmail: String!
      providerEmail: String!
      bookerName: String!
      providerName: String!
    ): BookingRequestResponse
    requestBookingAllow(authcode: String!): RequestBookingActionResponse
    requestBookingDeny(authcode: String!): RequestBookingActionResponse
    manualEscrowRelease(documentId: String!): Response
  }
`;
