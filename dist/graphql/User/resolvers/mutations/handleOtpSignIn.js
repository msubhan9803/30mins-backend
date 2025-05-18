var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import PendingOtp from '../../../../MongoModels/PendingOTP';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function handleOtpSignIn(parent, { email }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'handleOtpSignIn',
                    functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'handleOtpSignIn',
                functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
            });
            const safeEmail = escapeStringRegexp(email.trim());
            const pattern = `^${safeEmail}$`;
            const regex = new RegExp(pattern, 'i');
            const userExists = yield User.exists({ 'accountDetails.email': { $regex: regex } });
            if (!userExists) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'handleOtpSignIn',
                    functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
                    additionalMessage: 'No Account Found Linked to the Provided Email',
                    startLogId,
                });
                return {
                    message: 'No Account Found Linked to the Provided Email',
                    status: 404,
                };
            }
            const generatedToken = Math.floor(100000 + Math.random() * 900000);
            const trimmedEmail = email.trim();
            const createdOtpDocument = yield PendingOtp.create({
                email: trimmedEmail,
                otpToken: generatedToken,
            });
            yield sendEmail({
                otpToken: generatedToken,
            }, email, TEMPLATES.SIGN_IN.OTP_VERIFICATION, 'signups@30mins.com');
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'handleOtpSignIn',
                functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
                additionalMessage: `OTP Generated and Sent Successfully: OTP ${generatedToken}`,
                startLogId,
            });
            return {
                message: 'OTP Generated and Sent Successfully',
                status: 200,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'handleOtpSignIn',
                functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                message: 'Unknown Error',
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=handleOtpSignIn.js.map