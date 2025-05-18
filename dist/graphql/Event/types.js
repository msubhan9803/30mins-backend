import { gql } from 'apollo-server-express';
export const types = gql `
  enum EVENT_STATUS_TYPES {
    CANCELLED
    UPCOMING
    CONCLUDED
  }

  enum EVENT_AUTH_TYPE {
    NONE
    PRE_APPROVED
    VERIFIED_ONLY
  }

  enum EVENT_RECURRING_TYPE {
    NOT_RECURRING
    WEEKLY
    MONTHLY
  }

  input EventQuestionInput {
    questionType: String
    required: Boolean
    question: String
    options: [String]
  }

  type EventQuestionType {
    questionType: String
    required: Boolean
    question: String
    options: [String]
  }

  type answeredQuestionsType {
    questionType: String
    question: String
    answer: String
    selectedOptions: [String]
  }

  type AttendeeType {
    attendeeId: User
    eventId: Event
    answeredQuestions: [answeredQuestionsType]
    registeredDateTime: String
    attendingDateTime: String
    attendeeStatus: String
  }

  type MediaType {
    type: String
    link: String
  }

  type Event {
    _id: String
    userId: User
    serviceType: String
    serviceTitle: String
    serviceDuration: Int
    serviceAttendeeLimit: Int
    serviceAttendeeCount: Int
    serviceSlug: String
    serviceDateTime: String
    serviceRecurring: EVENT_RECURRING_TYPE
    serviceDescription: String
    isPublic: Boolean
    serviceAttendeesMessage: String
    searchTags: [String]
    serviceQuestions: Boolean
    serviceQuestionsList: [EventQuestionType]
    eventStatus: EVENT_STATUS_TYPES
    serviceImage: String
    serviceMedia: MediaType
    otpProtected: Boolean
    authenticationType: EVENT_AUTH_TYPE
    createdAt: String
    attendingDateTime: String
    registeredDateTime: String
  }

  type UpcomingEventDatesList {
    eventDateTime: String
    attendeeCount: Int
    isAttending: Boolean
  }

  type EventResponse {
    eventData: Event
    response: Response
  }

  type EventWithEventDatesResponse {
    eventData: Event
    eventUpcomingDates: [UpcomingEventDatesList]
    response: Response
  }

  type EventsResponse {
    eventsData: [Event]
    response: Response
  }

  type EventSlugResponse {
    eventSlugCheck: Boolean
    response: Response
  }

  type AttendeesByEventIdResponse {
    attendees: [AttendeeType]
    eventData: Event
    response: Response
  }

  type EventsForAttendeeOrOrganizerResponse {
    eventsData: [Event]
    totalRecords: Int
    response: Response
  }
`;
//# sourceMappingURL=types.js.map