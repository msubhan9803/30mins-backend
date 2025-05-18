import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import decryptObject from '../../../../utils/encryption/decryptObject';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getUserById(parent, {token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const user = await User.findById(decodedToken.UserId).exec();

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUserById',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    if (!user) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserById',
        functionParams: [
          {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'User Not Found',
        startLogId,
      });

      return {
        userData: null,
        response: {
          message: 'User Not Found',
          status: 404,
        },
      };
    }

    const decryptedUserData = await decryptObject(user);

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUserById',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      userData: decryptedUserData,
      test: 'TEST1',
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserById',
        functionParams: [{paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token}],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });

      return {
        userData: null,
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getUserById',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      userData: null,
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
