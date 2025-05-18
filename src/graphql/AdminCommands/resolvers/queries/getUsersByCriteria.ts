import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getUsersByCriteria(parent, {userSearchParams}, context, info) {
  let startLogId: String;

  const {importedBatch, welcomeComplete, verifiedEmail} = userSearchParams;
  try {
    const SECRETS = await AwsSecrets.getInstance();
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUsersByCriteria',
        functionParams: [
          {
            paramName: 'importedBatch',
            paramValue: importedBatch,
            paramType: typeof importedBatch,
          },
          {
            paramName: 'welcomeComplete',
            paramValue: 'welcomeComplete',
            paramType: typeof welcomeComplete,
          },
          {
            paramName: 'verifiedEmail',
            paramValue: 'verifiedEmail',
            paramType: typeof verifiedEmail,
          },
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
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUsersByCriteria',
      functionParams: [
        {
          paramName: 'importedBatch',
          paramValue: importedBatch,
          paramType: typeof importedBatch,
        },
        {
          paramName: 'welcomeComplete',
          paramValue: 'welcomeComplete',
          paramType: typeof welcomeComplete,
        },
        {
          paramName: 'verifiedEmail',
          paramValue: 'verifiedEmail',
          paramType: typeof verifiedEmail,
        },
      ],
    });

    const users = await User.find({
      importedBatch: importedBatch,
      welcomeComplete: welcomeComplete,
      'accountDetails.verifiedEmail': verifiedEmail,
    });

    if (users.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getUsersByCriteria',
        functionParams: [
          {
            paramName: 'importedBatch',
            paramValue: importedBatch,
            paramType: typeof importedBatch,
          },
          {
            paramName: 'welcomeComplete',
            paramValue: 'welcomeComplete',
            paramType: typeof welcomeComplete,
          },
          {
            paramName: 'verifiedEmail',
            paramValue: 'verifiedEmail',
            paramType: typeof verifiedEmail,
          },
        ],
        additionalMessage: 'No Users Found',
        startLogId,
      });

      return {
        userData: users,
        userCount: users.length,
        response: {
          message: 'No Users Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUsersByCriteria',
      functionParams: [
        {
          paramName: 'importedBatch',
          paramValue: importedBatch,
          paramType: typeof importedBatch,
        },
        {
          paramName: 'welcomeComplete',
          paramValue: 'welcomeComplete',
          paramType: typeof welcomeComplete,
        },
        {
          paramName: 'verifiedEmail',
          paramValue: 'verifiedEmail',
          paramType: typeof verifiedEmail,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      userData: users,
      userCount: users.length,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getUsersByCriteria',
      functionParams: [
        {
          paramName: 'importedBatch',
          paramValue: importedBatch,
          paramType: typeof importedBatch,
        },
        {
          paramName: 'welcomeComplete',
          paramValue: 'welcomeComplete',
          paramType: typeof welcomeComplete,
        },
        {
          paramName: 'verifiedEmail',
          paramValue: 'verifiedEmail',
          paramType: typeof verifiedEmail,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {message: err.message, status: 500},
    };
  }
}
