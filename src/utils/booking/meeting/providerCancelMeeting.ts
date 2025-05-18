import {cancelAgendaWithBookingId} from '../agendaHelpers';
import {canProviderCancel} from '../validators';
import {StatusUpdateData} from '../interface';
import sendEmail from '../../sendEmailHandler';

export const providerCancelMeeting = async (
  bookedMeeting,
  statusUpdateData: StatusUpdateData,
  isProvider: Boolean,
  agendaInstance,
  emailData,
  secreteEscrow,
  refundTemplate
) => {
  if (canProviderCancel(bookedMeeting, isProvider)) {
    bookedMeeting.status.providerCanceled = statusUpdateData.providerCanceled;
    bookedMeeting.status.refundRequested = statusUpdateData.refundRequested;
    bookedMeeting.status.reportReason = statusUpdateData.reportReason;

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
  }
};
