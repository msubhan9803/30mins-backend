import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getUserForStartConversation(parent, {keyword}) {
  let startLogId: String;
  const functionName = 'getUserForStartConversation';
  const functionParams = [
    {
      paramName: 'keyword',
      paramValue: keyword,
      paramType: typeof keyword,
    },
  ];
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName,
      functionParams,
    });

    const user = await User.findOne(
      {
        $or: [
          {'accountDetails.email': {$regex: keyword, $options: 'i'}},
          {'accountDetails.username': {$regex: keyword, $options: 'i'}},
        ],
      },
      [
        'accountDetails.email',
        'accountDetails.username',
        'personalDetails.name',
        'accountDetails.avatar',
      ]
    );
    console.log('user: ', user);

    if (!user) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName,
        functionParams,
        additionalMessage: 'No User Found',
        startLogId,
      });

      return {
        userData: user,
        response: {
          message: 'No user Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName,
      functionParams,
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
      functionName,
      functionParams,
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {message: err.message, status: 500},
    };
  }
}
