var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sendEmail from '../../sendEmailHandler';
import { canRequestRefund } from '../validators';
export const requestRefundOrder = (bookedMeeting, statusUpdateData, isProvider, dueDateUTC, agendaInstance, emailData, secrets, emailTemplate) => __awaiter(void 0, void 0, void 0, function* () {
    if (canRequestRefund(bookedMeeting, isProvider, dueDateUTC)) {
        bookedMeeting.status.hasOpenReport = statusUpdateData.hasOpenReport;
        bookedMeeting.status.reportReason = statusUpdateData.reportReason;
        yield agendaInstance.cancel({
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
            yield sendEmail(emailData, secrets, emailTemplate);
        }
        return true;
    }
    return false;
});
//# sourceMappingURL=requestRefundOrder.js.map