import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import PendingOtp from '../../../../MongoModels/PendingOTP';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function validateOtp(parent, {email, otpToken}, context, info) {
  let startLogId: String;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'validateOtp',
        functionParams: [
          {paramName: 'email', paramValue: email, paramType: typeof email},
          {paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken},
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

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'validateOtp',
      functionParams: [
        {paramName: 'email', paramValue: email, paramType: typeof email},
        {paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken},
      ],
    });

    const safeEmail = escapeStringRegexp(email.trim());
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const trimmedOTP = otpToken.trim();

    const validOtp = await PendingOtp.findOne({
      email: {$regex: emailRegex},
      otpToken: trimmedOTP,
    }).exec();

    if (!validOtp) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'validateOtp',
        functionParams: [
          {paramName: 'email', paramValue: email, paramType: typeof email},
          {paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken},
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

    const {name} = validOtp;

    await PendingOtp.deleteOne({email: {$regex: emailRegex}, otpToken}).exec();
    await User.findOneAndUpdate(
      {'accountDetails.email': {$regex: emailRegex}},
      {
        $unset: {
          couponCode: '',
        },
      }
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'validateOtp',
      functionParams: [
        {paramName: 'email', paramValue: email, paramType: typeof email},
        {paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken},
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
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'validateOtp',
      functionParams: [
        {paramName: 'email', paramValue: email, paramType: typeof email},
        {paramName: 'otpToken', paramValue: otpToken, paramType: typeof otpToken},
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
}
