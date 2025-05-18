/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import MutualAuths from '../../../../MongoModels/MutualAuths';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, consistent-return
export default async function getMutualAuthsById(_, {token}, __, ___) {
  let startLogId;
  try {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const UserId = await User.exists({_id: decodedToken?.UserId});
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getMutualAuthsById',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
    });

    if (!UserId) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getMutualAuthsById',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'User Document Not Found',
        startLogId,
      });
      return {
        response: {
          message: `User_Not_Found`,
          status: 200,
        },
      };
    }

    const data = await MutualAuths.findById(decodedToken?.UserId);

    await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getMutualAuthsById',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken?.UserId,
          paramType: typeof decodedToken?.UserId,
        },
      ],
    });

    return {
      response: {
        message: `Query Successful`,
        status: 200,
      },
      Data: data,
    };
  } catch (err) {
    switch (err.name) {
      case 'JsonWebTokenError':
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getMutualAuthsById',
          functionParams: [
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
          ],
          additionalMessage: 'User Document Not Found',
          startLogId,
        });
        return {
          response: {
            message: 'invalid_token',
            status: 500,
          },
          MData: [],
        };
      default:
        if (err.message.startsWith('Unexpected token')) {
          await createApiLog({
            type: ApiLogTypes.QUERY_END,
            level: ApiLogLevels.ERROR,
            functionName: 'getMutualAuthsById',
            functionParams: [
              {
                paramName: 'token',
                paramValue: 'HIDDEN_TOKEN',
                paramType: typeof token,
              },
            ],
            additionalMessage: 'User Document Not Found',
            startLogId,
          });
          return {
            response: {
              message: 'invalid_token',
              status: 500,
            },
            MData: [],
          };
        }
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getMutualAuthsById',
          functionParams: [
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
          ],
          additionalMessage: err.message,
          startLogId,
        });
        return {
          response: {
            message: 'server_err',
            status: 500,
          },
          MData: [],
        };
    }
  }
}
