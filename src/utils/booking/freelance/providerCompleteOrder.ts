import dayjs from 'dayjs';
import {canProviderCompleteOrder} from '../validators';

export const providerCompleteOrder = async (
  bookedMeeting,
  statusUpdateData,
  isProvider,
  dueDateUTC,
  agendaInstance,
  emailData
) => {
  if (canProviderCompleteOrder(bookedMeeting, isProvider)) {
    bookedMeeting.status.providerConfirmed = statusUpdateData.providerConfirmed;
    bookedMeeting.status.postMeetingNotes = statusUpdateData.postMeetingNotes;
    // cancel freelance
    await agendaInstance.cancel({
      'data.bookingId': bookedMeeting._id,
      name: {
        $in: ['send24HrDelayedFreelanceReminder', 'send24HrFreelanceReminder'],
      },
    });

    const scheduledTime = dayjs().add(3, 'day').toDate();

    if (bookedMeeting.paymentType === 'escrow') {
      await agendaInstance.schedule(scheduledTime, 'sendEscrowReleaseEmail', {
        emailData,
        paymentAccount: bookedMeeting.paymentAccount,
      });
    }
    return true;
  }
  return false;
};
