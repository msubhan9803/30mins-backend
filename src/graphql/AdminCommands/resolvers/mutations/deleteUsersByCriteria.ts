import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

export default async function deleteUsersByCriteria(parent, {criteria}, context, info) {
  let startLogId: String;
  const {importedBatch, welcomeComplete, verifiedEmail} = criteria;
  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteUsersByCriteria',
        functionParams: [
          {paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch},
          {
            paramName: 'welcomeComplete',
            paramValue: welcomeComplete,
            paramType: typeof welcomeComplete,
          },
          {paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail},
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
      functionName: 'deleteUsersByCriteria',
      functionParams: [
        {paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch},
        {
          paramName: 'welcomeComplete',
          paramValue: welcomeComplete,
          paramType: typeof welcomeComplete,
        },
        {paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail},
      ],
    });

    if (!importedBatch) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteUsersByCriteria',
        functionParams: [
          {paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch},
          {
            paramName: 'welcomeComplete',
            paramValue: welcomeComplete,
            paramType: typeof welcomeComplete,
          },
          {paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail},
        ],
        additionalMessage: 'Invalid Argument: Imported Batch must be passed',
      });

      return {
        response: {
          message: 'Invalid Argument: Imported Batch must be passed',
          status: 400,
        },
      };
    }

    const deletedUsers = await User.count({
      importedBatch,
      welcomeComplete,
      'accountDetails.verifiedEmail': verifiedEmail,
    });

    await User.deleteMany({
      importedBatch,
      welcomeComplete,
      'accountDetails.verifiedEmail': verifiedEmail,
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'deleteUsersByCriteria',
      functionParams: [
        {paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch},
        {
          paramName: 'welcomeComplete',
          paramValue: welcomeComplete,
          paramType: typeof welcomeComplete,
        },
        {paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail},
      ],
      additionalMessage: 'Users Deleted',
      startLogId,
    });

    return {
      deletedCount: deletedUsers,
      response: {
        message: 'Users Deleted',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'deleteUsersByCriteria',
      functionParams: [
        {paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch},
        {
          paramName: 'welcomeComplete',
          paramValue: welcomeComplete,
          paramType: typeof welcomeComplete,
        },
        {paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail},
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
