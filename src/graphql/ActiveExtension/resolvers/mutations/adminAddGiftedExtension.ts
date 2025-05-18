import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';

export default async function adminAddGiftedExtension(
  parent,
  {extensionProductId, extensionTitle, userEmail},
  context,
  info
) {
  let startLogId: String;
  let decodedToken: AccessToken;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    decodedToken = jwt.verify(context.token, accessTokenSecret) as unknown as AccessToken;
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getActiveExtensionsForAdmin',
      functionParams: [
        {
          paramName: 'extensionProductId',
          paramValue: extensionProductId,
          paramType: typeof extensionProductId,
        },
        {
          paramName: 'extensionTitle',
          paramValue: extensionTitle,
          paramType: typeof extensionTitle,
        },
        {
          paramName: 'userEmail',
          paramValue: userEmail,
          paramType: typeof userEmail,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: 'Not Authorized',
      status: 401,
    };
  }

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'adminAddGiftedExtension',
      functionParams: [
        {
          paramName: 'extensionProductId',
          paramValue: extensionProductId,
          paramType: typeof extensionProductId,
        },
        {
          paramName: 'extensionTitle',
          paramValue: extensionTitle,
          paramType: typeof extensionTitle,
        },
        {
          paramName: 'userEmail',
          paramValue: userEmail,
          paramType: typeof userEmail,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
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
        functionName: 'adminAddGiftedExtension',
        functionParams: [
          {
            paramName: 'extensionProductId',
            paramValue: extensionProductId,
            paramType: typeof extensionProductId,
          },
          {
            paramName: 'extensionTitle',
            paramValue: extensionTitle,
            paramType: typeof extensionTitle,
          },
          {
            paramName: 'userEmail',
            paramValue: userEmail,
            paramType: typeof userEmail,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
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

    const safeEmail = escapeStringRegexp(userEmail);
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const user = await User.findOne({'accountDetails.email': {$regex: emailRegex}}).orFail(
      () => new Error('User Document Not Found')
    );

    const existingExtension = await ActiveExtension.exists({
      userId: user._id,
      extensionProductId,
    });

    if (existingExtension) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminAddGiftedExtension',
        functionParams: [
          {
            paramName: 'extensionProductId',
            paramValue: extensionProductId,
            paramType: typeof extensionProductId,
          },
          {
            paramName: 'userEmail',
            paramValue: userEmail,
            paramType: typeof userEmail,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'User Already has this Extension',
      });

      return {
        message: 'User Already has this Extension',
        status: 409,
      };
    }

    const createdActiveExtension = await ActiveExtension.create({
      userId: user._id,
      extensionProductId,
      extensionTitle,
      status: 'gifted',
      customerId: 'gifted',
      subscriptionId: 'gifted',
      paymentMethodId: 'gifted',
    });

    await User.findByIdAndUpdate(user._id, {
      $push: {
        'accountDetails.activeExtensions': extensionProductId,
        'accountDetails.activeExtensionIDs': createdActiveExtension._id,
      },
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'adminAddGiftedExtension',
      functionParams: [
        {
          paramName: 'extensionProductId',
          paramValue: extensionProductId,
          paramType: typeof extensionProductId,
        },
        {
          paramName: 'userEmail',
          paramValue: userEmail,
          paramType: typeof userEmail,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
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
    if (err?._message === 'ActiveExtension validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminAddGiftedExtension',
        functionParams: [
          {
            paramName: 'extensionProductId',
            paramValue: extensionProductId,
            paramType: typeof extensionProductId,
          },
          {
            paramName: 'userEmail',
            paramValue: userEmail,
            paramType: typeof userEmail,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
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
      functionName: 'adminAddGiftedExtension',
      functionParams: [
        {
          paramName: 'extensionProductId',
          paramValue: extensionProductId,
          paramType: typeof extensionProductId,
        },
        {
          paramName: 'userEmail',
          paramValue: userEmail,
          paramType: typeof userEmail,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
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
