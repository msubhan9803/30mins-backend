var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { canClientConfirmOrder } from '../validators';
export const clientConfirmOrder = (bookedMeeting, statusUpdateData, isProvider, dueDateUTC, agendaInstance, emailData) => __awaiter(void 0, void 0, void 0, function* () {
    if (canClientConfirmOrder(bookedMeeting, isProvider)) {
        // confirm freelance
        bookedMeeting.status.clientConfirmed = statusUpdateData.clientConfirmed;
        bookedMeeting.status.postMeetingFeedback = statusUpdateData.postMeetingFeedback;
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
            yield agendaInstance.schedule('now', 'sendEscrowReleaseEmail', {
                emailData,
                providerId: bookedMeeting.provider,
                paymentAccount: bookedMeeting.paymentAccount,
            });
        }
        return true;
    }
    return false;
});
//# sourceMappingURL=clientConfirmOrder.js.map