import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import PendingOtp from '../../../../MongoModels/PendingOTP';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';

export default async function validateSmsOtp(
  parent,
  {phone, otpToken, forProviderExtension},
  context
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  let startLogId: String = '';
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let decodedToken;
  let userId = '';
  let functionParams = [];

  try {
    decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    userId = decodedToken.UserId;
    functionParams = [
      {paramName: 'phone', paramValue: phone, paramType: typeof phone},
      {paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken},
      {
        paramName: 'userId',
        paramValue: userId,
        paramType: typeof userId,
      },
    ];

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'validateSmsOtp',
      functionParams,
    });

    const safePhone = escapeStringRegexp(phone.trim());
    const phonePattern = `^${safePhone}$`;
    const phoneRegex = new RegExp(phonePattern, 'i');

    const trimmedOTP = otpToken.trim();

    const validOtp = await PendingOtp.findOne({
      phone: {$regex: phoneRegex},
      otpToken: trimmedOTP,
    });

    if (!validOtp) {
      await createApiLog({
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

    await PendingOtp.deleteOne({phone: {$regex: phoneRegex}, otpToken});

    if (forProviderExtension) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          'accountDetails.smsSettings.phone': phone,
          'accountDetails.smsSettings.reminders': true,
        },
      });
    }

    await createApiLog({
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
  } catch (err) {
    await createApiLog({
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
}
