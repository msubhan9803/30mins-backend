import getBookingById from './queries/getBookingById';
import getBookings from './queries/getBookings';
import getAllUpComingBookings from './queries/getAllUpComingBookings';
import getBookingsForAdmin from './queries/getBookingsForAdmin';
import checkEmailFilter from './queries/checkEmailFilter';
import getCurrentSlotBookings from './queries/getCurrentSlotBookings';
import getAvailability from './queries/getAvailability';
import getWeekdayAvailability from './queries/getWeekdayAvailability';
import getStatusAuthCode from './queries/getStatusAuthCode';
import getPreApprovedUsers from './queries/getPreApprovedUsers';
import getPendingPayouts from './queries/getPendingPayouts';
import confirmMeeting from './mutations/confirmMeeting';
import bookMeeting from './mutations/bookMeeting';
import createPendingMeeting from './mutations/createPendingMeeting';
import updateBookingStatus from './mutations/updateBookingStatus';
import updateCalendarEventIds from './mutations/updateCalendarEventIds';
import addStatusAuthCode from './mutations/addStatusAuthCode';
import updateStatusAuthCode from './mutations/updateStatusAuthCode';
import getRRAvailability from './queries/getRRAvailability';
import checkRecurringAvailability from './queries/checkRecurringAvailability';
import rescheduleMeeting from './mutations/rescheduleMeeting';
import requestBookingApprovals from './mutations/requestBookingApproval';
import requestBookingAllow from './mutations/requestBookingAllow';
import requestBookingDeny from './mutations/requestBookingDeny';
import manualEscrowRelease from './mutations/manualEscrowRelease';
const queries = {
    getBookings,
    getBookingsForAdmin,
    getCurrentSlotBookings,
    getBookingById,
    checkEmailFilter,
    getAvailability,
    getRRAvailability,
    getWeekdayAvailability,
    getAllUpComingBookings,
    checkRecurringAvailability,
    getStatusAuthCode,
    getPreApprovedUsers,
    getPendingPayouts,
};
const mutations = {
    rescheduleMeeting,
    bookMeeting,
    createPendingMeeting,
    updateBookingStatus,
    confirmMeeting,
    updateCalendarEventIds,
    addStatusAuthCode,
    updateStatusAuthCode,
    requestBookingApprovals,
    requestBookingAllow,
    requestBookingDeny,
    manualEscrowRelease,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map