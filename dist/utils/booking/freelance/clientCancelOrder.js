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
import { canClientCancelOrder } from '../validators';
export const clientCancelOrder = (bookedMeeting, isProvider, statusUpdateData, isOneHourPassedSinceBooking, isDueDatePassed, agendaInstance, emailData, secreteEscrow, refundTemplate) => __awaiter(void 0, void 0, void 0, function* () {
    if (canClientCancelOrder(bookedMeeting, isProvider, isOneHourPassedSinceBooking, isDueDatePassed)) {
        // cancel freelance
        bookedMeeting.status.clientCanceled = statusUpdateData.clientCanceled;
        bookedMeeting.status.reportReason = statusUpdateData.reportReason;
        yield agendaInstance.cancel({
            'data.bookingId': bookedMeeting._id,
            name: {
                $in: ['send24HrDelayedFreelanceReminder', 'send24HrFreelanceReminder'],
            },
        });
        if ((statusUpdateData === null || statusUpdateData === void 0 ? void 0 : statusUpdateData.refundRequested) && (bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.paymentType) === 'escrow') {
            yield agendaInstance.cancel({
                'data.bookingId': bookedMeeting._id,
                name: 'sendEscrowReleaseEmail',
            });
            yield sendEmail(emailData, secreteEscrow, refundTemplate);
        }
        return true;
    }
    return false;
});
//# sourceMappingURL=clientCancelOrder.js.map