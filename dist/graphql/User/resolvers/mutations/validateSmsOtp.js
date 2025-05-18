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
import jwt from 'jsonwebtoken';
export default function validateSmsOtp(parent, { phone, otpToken, forProviderExtension }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        let startLogId = '';
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let decodedToken;
        let userId = '';
        let functionParams = [];
        try {
            decodedToken = jwt.verify(token, accessTokenSecret);
            userId = decodedToken.UserId;
            functionParams = [
                { paramName: 'phone', paramValue: phone, paramType: typeof phone },
                { paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken },
                {
                    paramName: 'userId',
                    paramValue: userId,
                    paramType: typeof userId,
                },
            ];
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'validateSmsOtp',
                functionParams,
            });
            const safePhone = escapeStringRegexp(phone.trim());
            const phonePattern = `^${safePhone}$`;
            const phoneRegex = new RegExp(phonePattern, 'i');
            const trimmedOTP = otpToken.trim();
            const validOtp = yield PendingOtp.findOne({
                phone: { $regex: phoneRegex },
                otpToken: trimmedOTP,
            });
            if (!validOtp) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'validateSmsOtp',
                    functionParams,
                    additionalMessage: 'Invalid Permissions: Invalid OTP Token',
                    startLogId,
                });
                return {
                    message: 'Invalid OTP Token',
                    status: 400,
                };
            }
            yield PendingOtp.deleteOne({ phone: { $regex: phoneRegex }, otpToken });
            if (forProviderExtension) {
                yield User.findByIdAndUpdate(userId, {
                    $set: {
                        'accountDetails.smsSettings.phone': phone,
                        'accountDetails.smsSettings.reminders': true,
                    },
                });
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'validateSmsOtp',
                functionParams,
                additionalMessage: 'Valid OTP',
                startLogId,
            });
            return {
                message: 'Valid OTP',
                status: 200,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'validateSmsOtp',
                functionParams,
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
//# sourceMappingURL=validateSmsOtp.js.map