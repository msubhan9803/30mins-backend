var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
export default function sendProductEscrowReleaseEmail(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        agenda.define('sendProductEscrowReleaseEmail', (job, done) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { emailData, emailSendTo } = job.attrs.data;
                yield createApiLog({
                    type: ApiLogTypes.API_PROCESSING_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'sendProductEscrowReleaseEmail',
                    functionParams: [
                        {
                            paramName: 'emailData',
                            paramValue: emailData,
                            paramType: typeof emailData,
                        },
                    ],
                    additionalMessage: JSON.stringify(job.attrs.data),
                    startLogId: ``,
                });
                yield sendEmail(Object.assign({}, emailData), emailSendTo, TEMPLATES.PRODUCT.PRODUCT_RELEASE_ESCROW_TO_30MIN);
                yield job.remove();
                done();
            }
            catch (err) {
                yield createApiLog({
                    type: ApiLogTypes.API_PROCESSING_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'sendProductEscrowReleaseEmail',
                    functionParams: [],
                    additionalMessage: err.message,
                    startLogId: ``,
                });
                throw err;
            }
        }));
    });
}
//# sourceMappingURL=sendProductEscrowReleaseEmail.js.map