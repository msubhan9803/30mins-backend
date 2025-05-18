import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getUsersForSeo(
  parent,
  {resultsPerBatch, batchNumber},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  let startLogId: String;
  const {token} = context;

  try {
    if (token !== ENV_VALUES.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUsersForSeo',
        functionParams: [
          {
            paramName: 'resultsPerBatch',
            paramValue: resultsPerBatch,
            paramType: typeof resultsPerBatch,
          },
          {
            paramName: 'batchNumber',
            paramValue: batchNumber,
            paramType: typeof batchNumber,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUsersForSeo',
      functionParams: [
        {
          paramName: 'resultsPerBatch',
          paramValue: resultsPerBatch,
          paramType: typeof resultsPerBatch,
        },
        {
          paramName: 'batchNumber',
          paramValue: batchNumber,
          paramType: typeof batchNumber,
        },
      ],
    });

    const userData = await User.find({'accountDetails.verifiedEmail': true})
      .skip(resultsPerBatch * batchNumber - resultsPerBatch)
      .limit(resultsPerBatch)
      .select(['accountDetails.username', 'accountDetails.avatar', 'personalDetails.description']);

    const userCount = await User.count({'accountDetails.verifiedEmail': true});

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUsersForSeo',
      functionParams: [
        {
          paramName: 'resultsPerBatch',
          paramValue: resultsPerBatch,
          paramType: typeof resultsPerBatch,
        },
        {
          paramName: 'batchNumber',
          paramValue: batchNumber,
          paramType: typeof batchNumber,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      userData,
      userCount,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getUsersForSeo',
      functionParams: [
        {
          paramName: 'resultsPerBatch',
          paramValue: resultsPerBatch,
          paramType: typeof resultsPerBatch,
        },
        {
          paramName: 'batchNumber',
          paramValue: batchNumber,
          paramType: typeof batchNumber,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
