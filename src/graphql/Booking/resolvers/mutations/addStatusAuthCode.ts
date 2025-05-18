import {v4 as uuid} from 'uuid';

import StatusAuthCodeModel from '../../../../MongoModels/StatusAuthCode';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function addStatusAuthCode(_, {input}, {token}) {
  let startLogId: String;

  try {
    const SECRETS = await AwsSecrets.getInstance();

    if (token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'addStatusAuthCode',
        functionParams: [
          {
            paramName: 'StatusAuthCodeInput',
            paramValue: input,
            paramType: typeof input,
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
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'addStatusAuthCode',
      functionParams: [
        {
          paramName: 'StatusAuthCodeInput',
          paramValue: input,
          paramType: typeof input,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
    });

    const {availableStatus, bookingId, email, expireAt} = input;

    const statusAuthCode = new StatusAuthCodeModel({
      authCode: uuid(),
      availableStatus,
      bookingId,
      email,
      expireAt,
    });

    await statusAuthCode.save();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'addStatusAuthCode',
      functionParams: [
        {
          paramName: 'StatusAuthCodeInput',
          paramValue: input,
          paramType: typeof input,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
      additionalMessage: 'Status Code Added Successfully!',
      startLogId,
    });

    return {
      authCode: statusAuthCode,
      response: {
        status: 200,
        message: 'Status Code Added Successfully!',
      },
    };
  } catch (error) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'addStatusAuthCode',
      functionParams: [
        {
          paramName: 'StatusAuthCodeInput',
          paramValue: input,
          paramType: typeof input,
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
      response: {
        status: 500,
        message: error.message,
      },
    };
  }
}
