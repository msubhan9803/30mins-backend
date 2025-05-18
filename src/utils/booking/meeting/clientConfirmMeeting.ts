import {StatusUpdateData} from '../interface/index';
import {canConfirm} from '../validators';

import {cancelAgendaWithBookingId} from '../agendaHelpers';

export const clientConfirmMeeting = async (
  bookedMeeting,
  statusUpdateData: StatusUpdateData,
  isProvider,
  agendaInstance,
  emailData
) => {
  // Update “bookedmeeting" Status
  // clientConfirmed: True
  // Send Email to Provider
  // Remove Reminders
  // If Escrow - Release Funds
  if (canConfirm(bookedMeeting, isProvider)) {
    bookedMeeting.status.clientConfirmed = statusUpdateData.clientConfirmed;
    bookedMeeting.status.postMeetingFeedback = statusUpdateData.postMeetingFeedback;

    await cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
      'sendFollowUpEmail',
      'send15MinReminder',
      'send24HrReminder',
    ]);
    if (['direct', 'escrow'].includes(bookedMeeting?.paymentType)) {
      await agendaInstance.cancel({
        'data.bookingId': bookedMeeting.bookingId,
        name: {$in: ['sendEscrowReleaseEmail', 'sendDirectCompleteEmail']},
      });

      if (bookedMeeting?.paymentType === 'escrow') {
        await agendaInstance.schedule('now', 'sendEscrowReleaseEmail', {
          emailData,
          providerId: bookedMeeting.provider,
          paymentAccount: bookedMeeting.paymentAccount,
        });
      }

      if (bookedMeeting?.paymentType === 'direct') {
        await agendaInstance.schedule('now', 'sendDirectCompleteEmail', {emailData});
      }
      bookedMeeting.status.refunded = statusUpdateData.refunded;
    }
    return true;
  }
  return false;
};
