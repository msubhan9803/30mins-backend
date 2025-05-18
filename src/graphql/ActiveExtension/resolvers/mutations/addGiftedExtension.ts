import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function addGiftedExtension(
  parent,
  {extensionProductId, extensionTitle, userEmail},
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
        functionName: 'addGiftedExtension',
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
      functionName: 'addGiftedExtension',
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
      ],
    });

    const safeEmail = escapeStringRegexp(userEmail);
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const user = await User.findOne({'accountDetails.email': {$regex: emailRegex}})
      .orFail(() => new Error('User Document Not Found'))
      .exec();

    const existingExtension = await ActiveExtension.exists({
      userId: user._id,
      extensionProductId,
    });

    if (existingExtension) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'addGiftedExtension',
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
      functionName: 'addGiftedExtension',
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
        functionName: 'addGiftedExtension',
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
      functionName: 'addGiftedExtension',
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
