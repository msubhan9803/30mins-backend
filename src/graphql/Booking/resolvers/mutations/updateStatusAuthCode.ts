import StatusAuthCodeModel from '../../../../MongoModels/StatusAuthCode';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function updateStatusAuthCode(_, {id}, {token}) {
  let startLogId: String;

  try {
    const SECRETS = await AwsSecrets.getInstance();

    if (token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateStatusAuthCode',
        functionParams: [
          {
            paramName: 'id',
            paramValue: id,
            paramType: typeof id,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        status: 401,
        message: 'Not Authenticated',
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'bookMeeting',
      functionParams: [
        {
          paramName: 'updateStatusAuthCode',
          paramValue: id,
          paramType: typeof id,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
    });

    await StatusAuthCodeModel.findByIdAndUpdate(id, {used: true});

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateStatusAuthCode',
      functionParams: [
        {
          paramName: 'id',
          paramValue: id,
          paramType: typeof id,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
      additionalMessage: 'Status Code Updated Successfully!',
      startLogId,
    });

    return {
      status: 200,
      message: 'Status Code Updated Successfully!',
    };
  } catch (error) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'updateStatusAuthCode',
      functionParams: [
        {
          paramName: 'id',
          paramValue: id,
          paramType: typeof id,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
      additionalMessage: error.message,
      startLogId,
    });

    return {
      status: 500,
      message: error.message,
    };
  }
}
