import {gql} from 'apollo-server-express';

export const mutations = gql`
  input EventInput {
    serviceType: String
    serviceTitle: String!
    serviceDuration: Int!
    serviceAttendeeLimit: Int!
    serviceSlug: String
    serviceDateTime: String!
    serviceRecurring: EVENT_RECURRING_TYPE!
    serviceDescription: String!
    isPublic: Boolean
    serviceAttendeesMessage: String
    searchTags: [String]
    serviceQuestions: Boolean
    serviceQuestionsList: [EventQuestionInput]
    eventStatus: EVENT_STATUS_TYPES
    serviceImage: String
    serviceMedia: MediaInput
    otpProtected: Boolean
    authenticationType: EVENT_AUTH_TYPE
  }

  input EventEditInput {
    serviceType: String
    serviceTitle: String
    serviceDuration: Int
    serviceAttendeeLimit: Int
    serviceSlug: String
    serviceDateTime: String
    serviceRecurring: EVENT_RECURRING_TYPE
    serviceDescription: String
    isPublic: Boolean
    serviceAttendeesMessage: String
    searchTags: [String]
    serviceQuestions: Boolean
    serviceQuestionsList: [EventQuestionInput]
    eventStatus: EVENT_STATUS_TYPES
    serviceImage: String
    serviceMedia: MediaInput
    otpProtected: Boolean
    authenticationType: EVENT_AUTH_TYPE
  }

  input answeredQuestionsInput {
    questionType: String
    question: String
    answer: String
    selectedOptions: [String]
  }

  input addAttendeeInput {
    attendeeId: String!
    eventId: String!
    attendingDateTime: String!
    answeredQuestions: [answeredQuestionsInput]
  }

  type Mutation {
    createEvent(eventData: EventInput, token: String!): Response
    editEvent(eventData: EventEditInput, documentId: String!, token: String!): Response
    cancelEvent(documentId: String!, token: String!): Response
    addAttendee(attendeeData: addAttendeeInput): Response
    cancelAttendeeEvent(eventId: String, token: String): Response
    rescheduleEvent(documentId: String!, token: String!, newEventDateTime: String!): Response
  }
`;
