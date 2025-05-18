import {canClientConfirmOrder} from '../validators';

export const clientConfirmOrder = async (
  bookedMeeting,
  statusUpdateData,
  isProvider,
  dueDateUTC,
  agendaInstance,
  emailData
) => {
  if (canClientConfirmOrder(bookedMeeting, isProvider)) {
    // confirm freelance
    bookedMeeting.status.clientConfirmed = statusUpdateData.clientConfirmed;
    bookedMeeting.status.postMeetingFeedback = statusUpdateData.postMeetingFeedback;
    await agendaInstance.cancel({
      'data.bookingId': bookedMeeting._id,
      name: {
        $in: [
          'send24HrDelayedFreelanceReminder',
          'send24HrFreelanceReminder',
          'sendEscrowReleaseEmail',
        ],
      },
    });

    if (bookedMeeting.paymentType === 'escrow') {
      await agendaInstance.schedule('now', 'sendEscrowReleaseEmail', {
        emailData,
        providerId: bookedMeeting.provider,
        paymentAccount: bookedMeeting.paymentAccount,
      });
    }
    return true;
  }
  return false;
};
