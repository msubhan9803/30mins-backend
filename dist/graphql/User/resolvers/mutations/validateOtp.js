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
import PendingOtp from '../../../../MongoModels/PendingOTP';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function validateOtp(parent, { email, otpToken }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'validateOtp',
                    functionParams: [
                        { paramName: 'email', paramValue: email, paramType: typeof email },
                        { paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'validateOtp',
                functionParams: [
                    { paramName: 'email', paramValue: email, paramType: typeof email },
                    { paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken },
                ],
            });
            const safeEmail = escapeStringRegexp(email.trim());
            const emailPattern = `^${safeEmail}$`;
            const emailRegex = new RegExp(emailPattern, 'i');
            const trimmedOTP = otpToken.trim();
            const validOtp = yield PendingOtp.findOne({
                email: { $regex: emailRegex },
                otpToken: trimmedOTP,
            }).exec();
            if (!validOtp) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'validateOtp',
                    functionParams: [
                        { paramName: 'email', paramValue: email, paramType: typeof email },
                        { paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid OTP Token',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Invalid OTP Token',
                        status: 400,
                    },
                };
            }
            const { name } = validOtp;
            yield PendingOtp.deleteOne({ email: { $regex: emailRegex }, otpToken }).exec();
            yield User.findOneAndUpdate({ 'accountDetails.email': { $regex: emailRegex } }, {
                $unset: {
                    couponCode: '',
                },
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'validateOtp',
                functionParams: [
                    { paramName: 'email', paramValue: email, paramType: typeof email },
                    { paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken },
                ],
                additionalMessage: 'Valid OTP',
                startLogId,
            });
            return {
                email,
                name: name || '',
                response: {
                    message: 'Valid OTP',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'validateOtp',
                functionParams: [
                    { paramName: 'email', paramValue: email, paramType: typeof email },
                    { paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: {
                    message: 'Unknown Error',
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=validateOtp.js.map