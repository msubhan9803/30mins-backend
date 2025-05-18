import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

import StatisticsProcessingQueue from '../../../../MongoModels/StatisticsProcessingQueue';

export default async function updateGlobalBussinessStats(parent, {inputs}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateGlobalBussinessStats',
      functionParams: [
        {
          paramName: 'inputs',
          paramValue: inputs,
          paramType: typeof inputs,
        },
      ],
    });
    const SECRETS = await AwsSecrets.getInstance();
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'updateGlobalBussinessStats',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'inputs',
            paramValue: inputs,
            paramType: typeof inputs,
          },
        ],
        additionalMessage: 'Invalid Permissions: Missing Admin Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    await StatisticsProcessingQueue.create({
      schemaName: 'GlobalBussiness',
      ...inputs,
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateGlobalBussinessStats',
      functionParams: [
        {
          paramName: 'inputs',
          paramValue: inputs,
          paramType: typeof inputs,
        },
      ],
      additionalMessage: 'User Updated Successfully',
      startLogId,
    });

    return {
      message: 'Update added in the Queue.',
      status: 200,
    };
  } catch (err) {
    if (err?._message === 'StatisticsProcessingQueue validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateGlobalBussinessStats',
        functionParams: [
          {
            paramName: 'inputs',
            paramValue: inputs,
            paramType: typeof inputs,
          },
        ],
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
      functionName: 'updateGlobalBussinessStats',
      functionParams: [
        {
          paramName: 'inputs',
          paramValue: inputs,
          paramType: typeof inputs,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
