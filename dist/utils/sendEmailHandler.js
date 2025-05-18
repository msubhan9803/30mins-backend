var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sgMail from '@sendgrid/mail';
import createApiLog, { ApiLogLevels, ApiLogTypes } from './createApiLog';
import AwsSecrets from './getAwsSecrets';
export default function sendEmail(templateData, sendToEmail, templateId, bcc) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            startLogId = yield createApiLog({
                type: ApiLogTypes.API_PROCESSING_START,
                level: ApiLogLevels.INFO,
                functionName: 'sendEmail',
                functionParams: [
                    { paramName: 'templateData', paramValue: templateData, paramType: typeof templateData },
                    { paramName: 'sendToEmail', paramValue: sendToEmail, paramType: typeof sendToEmail },
                    { paramName: 'templateId', paramValue: templateId, paramType: typeof templateId },
                ],
            });
            const apiKey = ENV_VALUES.SEND_GRID_API_KEY ? ENV_VALUES.SEND_GRID_API_KEY : '';
            sgMail.setApiKey(apiKey);
            const payload = {
                to: sendToEmail,
                from: 'hello@30mins.com',
                dynamicTemplateData: templateData,
                templateId: templateId,
                bcc: ['emaillogs@30mins.com'],
            };
            if (bcc) {
                payload.bcc = [bcc];
            }
            yield sgMail.send(payload);
            yield createApiLog({
                type: ApiLogTypes.API_PROCESSING_END,
                level: ApiLogLevels.INFO,
                functionName: 'sendEmail',
                functionParams: [
                    { paramName: 'templateData', paramValue: templateData, paramType: typeof templateData },
                    { paramName: 'sendToEmail', paramValue: sendToEmail, paramType: typeof sendToEmail },
                    { paramName: 'templateId', paramValue: templateId, paramType: typeof templateId },
                ],
                additionalMessage: 'sendEmail Resolved Successfully',
                startLogId,
            });
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.API_PROCESSING_END,
                level: ApiLogLevels.ERROR,
                functionName: 'sendEmail',
                functionParams: [
                    { paramName: 'templateData', paramValue: templateData, paramType: typeof templateData },
                    { paramName: 'sendToEmail', paramValue: sendToEmail, paramType: typeof sendToEmail },
                    { paramName: 'templateId', paramValue: templateId, paramType: typeof templateId },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            throw err;
        }
    });
}
//# sourceMappingURL=sendEmailHandler.js.map