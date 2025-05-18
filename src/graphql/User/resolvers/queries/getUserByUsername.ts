import escapeStringRegexp from 'escape-string-regexp';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getUserByUsername(parent, {username}, context, info) {
  let startLogId: String;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUserByUsername',
      functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
    });

    if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserByUsername',
        functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
        additionalMessage: 'Invalid Permissions: Invalid BACKEND_API_KEY',
        startLogId,
      });

      return {
        userData: null,
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    const safeUsername = escapeStringRegexp(username);
    const pattern = `^${safeUsername}$`;
    const regex = new RegExp(pattern, 'i');

    const user = await User.findOne({'accountDetails.username': {$regex: regex}}).exec();

    if (!user) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserByUsername',
        functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
        additionalMessage: 'User Not Found',
        startLogId,
      });

      return {
        userData: null,
        response: {
          message: 'User Not Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUserByUsername',
      functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      userData: user,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getUserByUsername',
      functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      userData: null,
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
