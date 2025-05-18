import {StatusUpdateData} from '../interface/index';
import {canComplete} from '../validators';

import {cancelAgendaWithBookingId} from '../agendaHelpers';
import dayjs from 'dayjs';

export const completeMeeting = async (
  bookedMeeting,
  statusUpdateData: StatusUpdateData,
  isProvider,
  agendaInstance,
  emailData
) => {
  if (canComplete(bookedMeeting, isProvider)) {
    bookedMeeting.status.providerConfirmed = statusUpdateData.providerConfirmed;
    bookedMeeting.status.postMeetingNotes = statusUpdateData.postMeetingNotes;
    await cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
      'sendFollowUpEmail',
      'send15MinReminder',
      'send24HrReminder',
    ]);

    const scheduledTime = dayjs().add(3, 'day').toDate();
    if (bookedMeeting.paymentType === 'direct') {
      await agendaInstance.schedule(scheduledTime, 'sendDirectCompleteEmail', {emailData});
    }
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
