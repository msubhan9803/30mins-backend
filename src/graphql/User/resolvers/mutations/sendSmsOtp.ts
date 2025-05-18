import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import PendingOtp from '../../../../MongoModels/PendingOTP';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import sendSms from '../../../../utils/sendSms';

export default async function sendSmsOtp(parent, {phone}, context) {
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
      {
        paramName: 'userId',
        paramValue: userId,
        paramType: typeof userId,
      },
    ];
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'sendSmsOtp',
      functionParams: functionParams,
    });

    const generatedToken = Math.floor(100000 + Math.random() * 900000);

    const trimmedPhone = phone.trim();

    await PendingOtp.create({
      phone: trimmedPhone,
      otpToken: generatedToken,
    });

    await sendSms(`30mins.com OTP ${generatedToken}`, trimmedPhone);

    await createApiLog({
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
  } catch (err) {
    await createApiLog({
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
}
