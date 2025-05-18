import {gql} from 'apollo-server-express';

export const queries = gql`
  input EventsSearchParams {
    isOrganizer: Boolean
    pageNumber: Int
    resultsPerPage: Int
    month: Int
    year: Int
  }

  type Query {
    getEventBySlug(token: String!, slug: String!): EventWithEventDatesResponse
    getEventBySlugWithoutToken(slug: String!): EventWithEventDatesResponse
    getEventsByUser(token: String): EventsResponse
    getEventsByUserId(userId: String): EventsResponse
    getEventById(token: String!, documentId: String!): EventResponse
    getAllEvents: EventsResponse
    getEventSlug(token: String, slug: String!): EventSlugResponse
    getAllAttendeesByEventId(eventId: String): AttendeesByEventIdResponse
    getEventsForAttendeeOrOrganizer(
      searchParams: EventsSearchParams
      token: String
    ): EventsForAttendeeOrOrganizerResponse
  }
`;
