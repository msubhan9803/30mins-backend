var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { cancelAgendaWithBookingId } from '../agendaHelpers';
import { canReport } from '../validators';
export const clientReportMeeting = (bookedMeeting, statusUpdateData, isProvider, agendaInstance) => __awaiter(void 0, void 0, void 0, function* () {
    if (canReport(bookedMeeting, isProvider)) {
        bookedMeeting.status.hasOpenReport = statusUpdateData.hasOpenReport;
        bookedMeeting.status.reportReason = statusUpdateData.reportReason;
        yield cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
            'sendFollowUpEmail',
            'send15MinReminder',
            'send24HrReminder',
        ]);
    }
});
//# sourceMappingURL=clientReportMeeting.js.map