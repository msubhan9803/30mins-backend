import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function adminDeleteActiveExtension(parent, {documentId}, context, info) {
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  const {token} = context;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'adminDeleteActiveExtension',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const isAdminUser = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': 'admin',
    });
    if (!isAdminUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminDeleteActiveExtension',
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
        message: 'Not Authorized',
        status: 401,
      };
    }

    const deletedAdminActiveExtension = await ActiveExtension.findOneAndDelete({
      _id: documentId,
    });

    await User.findByIdAndUpdate(deletedAdminActiveExtension.userId, {
      $pull: {
        'accountDetails.activeExtensions': deletedAdminActiveExtension.extensionProductId,
        'accountDetails.activeExtensionIDs': deletedAdminActiveExtension._id,
      },
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'adminDeleteActiveExtension',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Admin Active Extension Deleted Successfully',
      startLogId,
    });

    return {
      message: 'Admin Active Extension Deleted Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminDeleteActiveExtension',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'adminDeleteActiveExtension',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
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
      message: err.message,
      status: 500,
    };
  }
}
