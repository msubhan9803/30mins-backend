import {StatusUpdateData} from '../interface/index';
import {cancelAgendaWithBookingId} from '../agendaHelpers';
import {canDecline} from '../validators';
import sendEmail from '../../sendEmailHandler';

export const providerDeclineMeeting = async (
  bookedMeeting,
  statusUpdateData: StatusUpdateData,
  isProvider,
  agendaInstance,
  emailData,
  secreteEscrow,
  refundTemplate
) => {
  if (canDecline(bookedMeeting, isProvider)) {
    bookedMeeting.status.providerDeclined = statusUpdateData?.providerDeclined;
    bookedMeeting.status.reportReason = statusUpdateData?.reportReason;
    if (bookedMeeting?.price > 0) {
      bookedMeeting.status.refundRequested = statusUpdateData?.refundRequested;
    }
    await cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
      'sendFollowUpEmail',
      'send15MinReminder',
      'send24HrReminder',
    ]);
    if (statusUpdateData?.refundRequested && bookedMeeting?.paymentType === 'escrow') {
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
