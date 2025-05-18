import {cancelAgendaWithBookingId} from '../agendaHelpers';
import {canRefundReport} from '../validators';
import {StatusUpdateData} from '../interface';
import sendEmail from '../../sendEmailHandler';

export const clientRefundMeeting = async (
  bookedMeeting,
  statusUpdateData: StatusUpdateData,
  isProvider: Boolean,
  agendaInstance,
  emailData,
  secrets,
  emailTemplate
) => {
  if (canRefundReport(bookedMeeting, isProvider)) {
    bookedMeeting.status.hasOpenReport = statusUpdateData.hasOpenReport;
    bookedMeeting.status.refundRequested = statusUpdateData.refundRequested;
    bookedMeeting.status.reportReason = statusUpdateData.reportReason;

    await cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
      'sendFollowUpEmail',
      'send15MinReminder',
      'send24HrReminder',
    ]);

    if (statusUpdateData.refundRequested && bookedMeeting.paymentType === 'escrow') {
      await agendaInstance.cancel({
        'data.bookingId': bookedMeeting?.bookingId,
        name: 'sendEscrowReleaseEmail',
      });
      await sendEmail(emailData, secrets, emailTemplate);
    }
    return true;
  }
  return false;
};
