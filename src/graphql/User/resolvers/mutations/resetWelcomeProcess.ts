import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function resetWelcomeProcess(_, {username}, context) {
  let startLogId: String;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'validateOtp',
        functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
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
      functionName: 'makeUserVerified',
      functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
    });

    await User.findOneAndUpdate(
      {
        $or: [
          {'accountDetails.username': {$regex: new RegExp(`^${username}$`, 'i')}},
          {'accountDetails.email': {$regex: new RegExp(`^${username}$`, 'i')}},
        ],
      },
      {
        $set: {
          welcomeComplete: false,
        },
      }
    ).orFail(() => new Error('User Document Not Found'));

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'makeUserVerified',
      functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
      additionalMessage: 'User Updated Successfully',
      startLogId,
    });

    return {
      message: 'User Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'makeUserVerified',
        functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    if (err?._message === 'User validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'makeUserVerified',
        functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
        additionalMessage: err.message,
        startLogId,
      });

      return {
        message: err.message,
        status: 400,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'makeUserVerified',
      functionParams: [{paramName: 'username', paramValue: username, paramType: typeof username}],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
