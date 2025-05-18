var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { canComplete } from '../validators';
import { cancelAgendaWithBookingId } from '../agendaHelpers';
import dayjs from 'dayjs';
export const completeMeeting = (bookedMeeting, statusUpdateData, isProvider, agendaInstance, emailData) => __awaiter(void 0, void 0, void 0, function* () {
    if (canComplete(bookedMeeting, isProvider)) {
        bookedMeeting.status.providerConfirmed = statusUpdateData.providerConfirmed;
        bookedMeeting.status.postMeetingNotes = statusUpdateData.postMeetingNotes;
        yield cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
            'sendFollowUpEmail',
            'send15MinReminder',
            'send24HrReminder',
        ]);
        const scheduledTime = dayjs().add(3, 'day').toDate();
        if (bookedMeeting.paymentType === 'direct') {
            yield agendaInstance.schedule(scheduledTime, 'sendDirectCompleteEmail', { emailData });
        }
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
//# sourceMappingURL=completeMeeting.js.map