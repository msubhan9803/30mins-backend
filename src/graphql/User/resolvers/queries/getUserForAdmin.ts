import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getUserForAdmin(parent, {token, documentId}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUserForAdmin',
      functionParams: [
        {
          paramName: 'adminUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
      ],
    });

    const isAdminUser = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': 'admin',
    });

    if (!isAdminUser) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserForAdmin',
        functionParams: [
          {
            paramName: 'adminUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
        ],
        additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const user = await User.findById(documentId).exec();

    if (!user) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserForAdmin',
        functionParams: [
          {
            paramName: 'adminUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUserForAdmin',
      functionParams: [
        {
          paramName: 'adminUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
      ],
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
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserForAdmin',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
        ],
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
      functionName: 'getUserForAdmin',
      functionParams: [
        {
          paramName: 'adminUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
