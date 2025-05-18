import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function createActiveExtension(
  parent,
  {activeExtensionData, token},
  context,
  info
) {
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createActiveExtension',
      functionParams: [
        {
          paramName: 'activeExtensionData',
          paramValue: activeExtensionData,
          paramType: typeof activeExtensionData,
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

    const {
      extensionTitle,
      paymentMethodId,
      subscriptionId,
      customerId,
      extensionProductId,
      status,
    } = activeExtensionData;

    const createdActiveExtension = await ActiveExtension.create({
      userId: decodedToken.UserId,
      extensionProductId,
      extensionTitle,
      paymentMethodId,
      subscriptionId,
      customerId,
      status,
    });

    await User.findByIdAndUpdate(decodedToken.UserId, {
      $push: {
        'accountDetails.activeExtensions': extensionProductId,
        'accountDetails.activeExtensionIDs': createdActiveExtension._id,
      },
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createActiveExtension',
      functionParams: [
        {
          paramName: 'activeExtensionData',
          paramValue: activeExtensionData,
          paramType: typeof activeExtensionData,
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
      additionalMessage: 'Active Extension Added Successfully',
      startLogId,
    });

    return {
      message: 'Active Extension Added Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createActiveExtension',
        functionParams: [
          {
            paramName: 'activeExtensionData',
            paramValue: activeExtensionData,
            paramType: typeof activeExtensionData,
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

    if (err?._message === 'ActiveExtension validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createActiveExtension',
        functionParams: [
          {
            paramName: 'activeExtensionData',
            paramValue: activeExtensionData,
            paramType: typeof activeExtensionData,
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
        additionalMessage: 'Mongoose ActiveExtension Validation Failed',
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
      functionName: 'createActiveExtension',
      functionParams: [
        {
          paramName: 'activeExtensionData',
          paramValue: activeExtensionData,
          paramType: typeof activeExtensionData,
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
