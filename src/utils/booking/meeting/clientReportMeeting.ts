import {cancelAgendaWithBookingId} from '../agendaHelpers';
import {canReport} from '../validators';
import {StatusUpdateData} from '../interface';

export const clientReportMeeting = async (
  bookedMeeting,
  statusUpdateData: StatusUpdateData,
  isProvider: Boolean,
  agendaInstance
) => {
  if (canReport(bookedMeeting, isProvider)) {
    bookedMeeting.status.hasOpenReport = statusUpdateData.hasOpenReport;
    bookedMeeting.status.reportReason = statusUpdateData.reportReason;
    await cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
      'sendFollowUpEmail',
      'send15MinReminder',
      'send24HrReminder',
    ]);
  }
};
