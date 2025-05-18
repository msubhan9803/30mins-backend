import {cancelAgendaWithBookingId} from '../agendaHelpers';
import {canClientCancel} from '../validators';
import {StatusUpdateData} from '../interface';
import sendEmail from '../../sendEmailHandler';

export const clientCancelMeeting = async (
  bookedMeeting,
  statusUpdateData: StatusUpdateData,
  isProvider: Boolean,
  agendaInstance,
  emailData,
  secreteEscrow,
  refundTemplate
) => {
  if (canClientCancel(bookedMeeting, isProvider)) {
    bookedMeeting.status.clientCanceled = statusUpdateData.clientCanceled;
    bookedMeeting.status.reportReason = statusUpdateData.reportReason;
    await cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
      'sendFollowUpEmail',
      'send15MinReminder',
      'send24HrReminder',
    ]);
    if (bookedMeeting?.paymentType === 'escrow') {
      await agendaInstance.cancel({
        'data.bookingId': bookedMeeting._id,
        name: 'sendEscrowReleaseEmail',
      });
      await sendEmail(emailData, secreteEscrow, refundTemplate);
    }

    return true;
  }
  return false;
};
