var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dayjs from 'dayjs';
import { canProviderCompleteOrder } from '../validators';
export const providerCompleteOrder = (bookedMeeting, statusUpdateData, isProvider, dueDateUTC, agendaInstance, emailData) => __awaiter(void 0, void 0, void 0, function* () {
    if (canProviderCompleteOrder(bookedMeeting, isProvider)) {
        bookedMeeting.status.providerConfirmed = statusUpdateData.providerConfirmed;
        bookedMeeting.status.postMeetingNotes = statusUpdateData.postMeetingNotes;
        // cancel freelance
        yield agendaInstance.cancel({
            'data.bookingId': bookedMeeting._id,
            name: {
                $in: ['send24HrDelayedFreelanceReminder', 'send24HrFreelanceReminder'],
            },
        });
        const scheduledTime = dayjs().add(3, 'day').toDate();
        if (bookedMeeting.paymentType === 'escrow') {
            yield agendaInstance.schedule(scheduledTime, 'sendEscrowReleaseEmail', {
                emailData,
                paymentAccount: bookedMeeting.paymentAccount,
            });
        }
        return true;
    }
    return false;
});
//# sourceMappingURL=providerCompleteOrder.js.map