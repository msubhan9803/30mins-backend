import sendEmail from '../../sendEmailHandler';
import {canClientCancelOrder} from '../validators';

export const clientCancelOrder = async (
  bookedMeeting,
  isProvider,
  statusUpdateData,
  isOneHourPassedSinceBooking,
  isDueDatePassed,
  agendaInstance,
  emailData,
  secreteEscrow,
  refundTemplate
) => {
  if (
    canClientCancelOrder(bookedMeeting, isProvider, isOneHourPassedSinceBooking, isDueDatePassed)
  ) {
    // cancel freelance
    bookedMeeting.status.clientCanceled = statusUpdateData.clientCanceled;
    bookedMeeting.status.reportReason = statusUpdateData.reportReason;
    await agendaInstance.cancel({
      'data.bookingId': bookedMeeting._id,
      name: {
        $in: ['send24HrDelayedFreelanceReminder', 'send24HrFreelanceReminder'],
      },
    });
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
