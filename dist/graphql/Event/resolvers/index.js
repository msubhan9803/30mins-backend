import getEventBySlug from './queries/getEventBySlug';
import getEventsByUser from './queries/getEventsByUser';
import getEventById from './queries/getEventById';
import getAllEvents from './queries/getAllEvents';
import getEventSlug from './queries/getEventSlug';
import getEventsByUserId from './queries/getEventsByUserId';
import getAllAttendeesByEventId from './queries/getAllAttendeesByEventId';
import getEventsForAttendeeOrOrganizer from './queries/getEventsForAttendeeOrOrganizer';
import getEventBySlugWithoutToken from './queries/getEventBySlugWithoutToken';
import createEvent from './mutations/createEvent';
import editEvent from './mutations/editEvent';
import cancelEvent from './mutations/cancelEvent';
import addAttendee from './mutations/addAttendee';
import cancelAttendeeEvent from './mutations/cancelAttendeeEvent';
import rescheduleEvent from './mutations/rescheduleEvent';
const queries = {
    getEventBySlug,
    getEventsByUser,
    getEventById,
    getAllEvents,
    getEventSlug,
    getEventsByUserId,
    getAllAttendeesByEventId,
    getEventsForAttendeeOrOrganizer,
    getEventBySlugWithoutToken,
};
const mutations = {
    createEvent,
    editEvent,
    cancelEvent,
    addAttendee,
    cancelAttendeeEvent,
    rescheduleEvent,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map