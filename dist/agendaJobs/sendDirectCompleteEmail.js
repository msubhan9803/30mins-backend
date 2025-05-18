var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import AwsSecrets from '../utils/getAwsSecrets';
export default function sendDirectCompleteEmail(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            agenda.define('sendDirectCompleteEmail', (job, done) => __awaiter(this, void 0, void 0, function* () {
                const { EMAIL_DATA } = job.attrs.data;
                yield sendEmail(EMAIL_DATA, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.POST_BOOKING.PAID_MEETING_COMPLETE_TO_30MIN);
                yield job.remove();
                done();
            }));
        }
        catch (err) {
            throw err;
        }
    });
}
//# sourceMappingURL=sendDirectCompleteEmail.js.map