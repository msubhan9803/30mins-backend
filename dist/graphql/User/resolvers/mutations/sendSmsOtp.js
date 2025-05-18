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
import AwsSecrets from '../../../../utils/getAwsSecrets';
import jwt from 'jsonwebtoken';
import sendSms from '../../../../utils/sendSms';
export default function sendSmsOtp(parent, { phone }, context) {
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
                {
                    paramName: 'userId',
                    paramValue: userId,
                    paramType: typeof userId,
                },
            ];
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'sendSmsOtp',
                functionParams: functionParams,
            });
            const generatedToken = Math.floor(100000 + Math.random() * 900000);
            const trimmedPhone = phone.trim();
            yield PendingOtp.create({
                phone: trimmedPhone,
                otpToken: generatedToken,
            });
            yield sendSms(`30mins.com OTP ${generatedToken}`, trimmedPhone);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'sendSmsOtp',
                functionParams: functionParams,
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
                functionName: 'sendSmsOtp',
                functionParams,
                additionalMessage: err.message,
                startLogId,
            });
            console.log(err.message);
            return {
                message: 'Unknown Error',
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=sendSmsOtp.js.map