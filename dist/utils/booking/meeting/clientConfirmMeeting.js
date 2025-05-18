var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { canConfirm } from '../validators';
import { cancelAgendaWithBookingId } from '../agendaHelpers';
export const clientConfirmMeeting = (bookedMeeting, statusUpdateData, isProvider, agendaInstance, emailData) => __awaiter(void 0, void 0, void 0, function* () {
    // Update “bookedmeeting" Status
    // clientConfirmed: True
    // Send Email to Provider
    // Remove Reminders
    // If Escrow - Release Funds
    if (canConfirm(bookedMeeting, isProvider)) {
        bookedMeeting.status.clientConfirmed = statusUpdateData.clientConfirmed;
        bookedMeeting.status.postMeetingFeedback = statusUpdateData.postMeetingFeedback;
        yield cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
            'sendFollowUpEmail',
            'send15MinReminder',
            'send24HrReminder',
        ]);
        if (['direct', 'escrow'].includes(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.paymentType)) {
            yield agendaInstance.cancel({
                'data.bookingId': bookedMeeting.bookingId,
                name: { $in: ['sendEscrowReleaseEmail', 'sendDirectCompleteEmail'] },
            });
            if ((bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.paymentType) === 'escrow') {
                yield agendaInstance.schedule('now', 'sendEscrowReleaseEmail', {
                    emailData,
                    providerId: bookedMeeting.provider,
                    paymentAccount: bookedMeeting.paymentAccount,
                });
            }
            if ((bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.paymentType) === 'direct') {
                yield agendaInstance.schedule('now', 'sendDirectCompleteEmail', { emailData });
            }
            bookedMeeting.status.refunded = statusUpdateData.refunded;
        }
        return true;
    }
    return false;
});
//# sourceMappingURL=clientConfirmMeeting.js.map