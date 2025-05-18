import sendEmail from '../../sendEmailHandler';
import {canRequestRefund} from '../validators';

export const requestRefundOrder = async (
  bookedMeeting,
  statusUpdateData,
  isProvider,
  dueDateUTC,
  agendaInstance,
  emailData,
  secrets,
  emailTemplate
) => {
  if (canRequestRefund(bookedMeeting, isProvider, dueDateUTC)) {
    bookedMeeting.status.hasOpenReport = statusUpdateData.hasOpenReport;
    bookedMeeting.status.reportReason = statusUpdateData.reportReason;

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
      await sendEmail(emailData, secrets, emailTemplate);
    }
    return true;
  }
  return false;
};
