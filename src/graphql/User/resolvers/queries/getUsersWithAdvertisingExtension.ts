import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getUsersWithAdvertisingExtension(parent, params, context, info) {
  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUsersWithAdvertisingExtension',
        functionParams: [{paramName: null, paramValue: null, paramType: typeof null}],
        additionalMessage: 'Invalid Permissions: Invalid BACKEND_API_KEY',
      });

      return {
        userData: null,
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    const filter = {
      'accountDetails.activeExtensions': {
        $elemMatch: {$eq: stripeProductIDs.EXTENSIONS.ADVERTISEMENT},
      },
    };
    const userCount = await User.count(filter).exec();
    let skipCount = Math.floor(Math.random() * userCount);

    if (userCount - skipCount < 2) {
      skipCount = skipCount - 2 < 0 ? 0 : skipCount - 2;
    }

    const filteredUsers = await User.find(filter).skip(skipCount).limit(2).exec();

    return {
      userData: filteredUsers,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    return {
      userData: null,
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
