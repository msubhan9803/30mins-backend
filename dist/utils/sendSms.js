var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import twilio from 'twilio';
import AwsSecrets from './getAwsSecrets';
export default function sendSms(textBody, sendToNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accountSid = ENV_VALUES.TWILIO_SID;
        const authToken = ENV_VALUES.TWILIO_AUTH_TOKEN;
        const twilioNumber = ENV_VALUES.TWILIO_PHONE_NUMBER;
        const client = twilio(accountSid, authToken);
        yield client.messages.create({
            body: textBody,
            from: twilioNumber,
            to: sendToNumber,
        });
    });
}
//# sourceMappingURL=sendSms.js.map