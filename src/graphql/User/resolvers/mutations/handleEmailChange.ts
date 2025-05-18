import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import cuid from 'cuid';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import PendingOtp from '../../../../MongoModels/PendingOTP';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function handleEmailChange(parent, {email}, context, info) {
  let startLogId: String;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'handleEmailChange',
        functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'handleEmailChange',
      functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
    });

    const safeEmail = escapeStringRegexp(email.trim());
    const pattern = `^${safeEmail}$`;
    const regex = new RegExp(pattern, 'i');

    const userExists = await User.exists({'accountDetails.email': {$regex: regex}});

    const generatedToken = cuid();

    const trimmedEmail = email.trim();

    const createdOtpDocument = await PendingOtp.create({
      email: trimmedEmail,
      otpToken: generatedToken,
    });

    if (userExists) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'handleEmailChange',
        functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
        additionalMessage:
          'An account was found linked to the provided email. Please select another.',
        startLogId,
      });

      return {
        message: 'An account was found linked to the provided email. Please select another.',
        status: 409,
      };
    }

    await sendEmail(
      {
        otpToken: generatedToken,
      },
      email,
      TEMPLATES.SIGN_IN.OTP_VERIFICATION,
      'signups@30mins.com'
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'handleEmailChange',
      functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
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
      functionName: 'handleEmailChange',
      functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: 'Unknown Error',
      status: 500,
    };
  }
}
