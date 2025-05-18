import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function checkVerifiedStatus(parent, {email}: {email: string}, context, info) {
  let startLogId: String;

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'checkVerifiedStatus',
      functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
    });
    email = email.trim().toLowerCase();
    const user = await User.findOne({'accountDetails.email': email}, [
      'accountDetails.verifiedAccount',
    ]);

    if (user?.accountDetails?.verifiedAccount !== true) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'checkVerifiedStatus',
        functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
        additionalMessage: 'Account Not Verified!',
        startLogId,
      });

      return {
        message: 'Account Not Verified!',
        status: 200,
      };
    }
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'checkVerifiedStatus',
      functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
      additionalMessage: 'Account  Verified!',
      startLogId,
    });

    return {
      message: 'Account Verified!',
      status: 200,
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'checkVerifiedStatus',
      functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
