import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function removeGiftedExtension(
  parent,
  {extensionProductId, userEmail},
  context,
  info
) {
  let startLogId: String;

  try {
    const SECRETS = await AwsSecrets.getInstance();
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'removeGiftedExtension',
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
        ],
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'removeGiftedExtension',
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
      ],
    });

    const safeEmail = escapeStringRegexp(userEmail);
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const user = await User.findOne({'accountDetails.email': {$regex: emailRegex}})
      .orFail(() => new Error('User Document Not Found'))
      .exec();

    const deletedExtension = await ActiveExtension.findOneAndDelete({
      userId: user._id,
      extensionProductId,
    }).orFail(() => new Error('Active Extension Document Not Found'));

    await User.findByIdAndUpdate(user._id, {
      $pull: {
        'accountDetails.activeExtensions': extensionProductId,
        'accountDetails.activeExtensionIDs': deletedExtension._id,
      },
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'removeGiftedExtension',
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
      ],
      additionalMessage: 'Active Extension Removed Successfully',
      startLogId,
    });

    return {
      message: 'Active Extension Removed Successfully',
      status: 200,
    };
  } catch (err) {
    if (['Active Extension Document Not Found', 'User Document Not Found'].includes(err.message)) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'removeGiftedExtension',
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
        ],
        additionalMessage: err.message,
        startLogId,
      });

      return {
        message: err.message,
        status: 404,
      };
    }
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'removeGiftedExtension',
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
