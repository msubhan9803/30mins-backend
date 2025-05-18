import StatusAuthCodeModel from '../../../../MongoModels/StatusAuthCode';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getStatusAuthCode(_, {bookingId, email, authCode}, {token}) {
  let startLogId: String;
  let query;

  if (authCode) {
    query = {authCode};
  }

  if (bookingId && email) {
    query = {
      $and: [{email: {$eq: email}}, {bookingId: {$eq: bookingId}}],
    };
  }

  try {
    const SECRETS = await AwsSecrets.getInstance();

    if (token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getStatusAuthCode',
        functionParams: [
          {
            paramName: 'authCode',
            paramValue: authCode,
            paramType: typeof authCode,
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
        response: {
          status: 401,
          message: 'Not Authenticated',
        },
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getStatusAuthCode',
      functionParams: [
        {
          paramName: 'authCode',
          paramValue: authCode,
          paramType: typeof authCode,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
    });

    const statusAuthCode = await StatusAuthCodeModel.findOne(query);

    if (!statusAuthCode) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getStatusAuthCode',
        functionParams: [
          {
            paramName: 'authCode',
            paramValue: authCode,
            paramType: typeof authCode,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Status Auth Code Not Found!',
        startLogId,
      });

      return {
        response: {
          message: 'Status Auth Code Not Found!',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getStatusAuthCode',
      functionParams: [
        {
          paramName: 'authCode',
          paramValue: authCode,
          paramType: typeof authCode,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      statusAuthCode,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (error) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getStatusAuthCode',
      functionParams: [
        {
          paramName: 'authCode',
          paramValue: authCode,
          paramType: typeof authCode,
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
      reponse: {
        message: error.message,
        status: 500,
      },
    };
  }
}
