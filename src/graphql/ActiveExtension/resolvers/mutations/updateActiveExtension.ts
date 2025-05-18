import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function updateActiveExtension(
  parent,
  {activeExtensionData, customerId, subscriptionId},
  context,
  info
) {
  let startLogId: String;

  try {
    const SECRETS = await AwsSecrets.getInstance();

    if (context.token !== SECRETS.BACKEND_API_KEY) {
      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateActiveExtension',
      functionParams: [
        {
          paramName: 'activeExtensionData',
          paramValue: activeExtensionData,
          paramType: typeof activeExtensionData,
        },
        {
          paramName: 'customerId',
          paramValue: customerId,
          paramType: typeof customerId,
        },
        {
          paramName: 'subscriptionId',
          paramValue: 'subscriptionId',
          paramType: typeof subscriptionId,
        },
      ],
    });

    await ActiveExtension.findOneAndUpdate(
      {
        customerId,
        extensionsubscriptionId: subscriptionId,
      },
      {
        $set: {
          ...activeExtensionData,
        },
      }
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateActiveExtension',
      functionParams: [
        {
          paramName: 'activeExtensionData',
          paramValue: activeExtensionData,
          paramType: typeof activeExtensionData,
        },
        {
          paramName: 'customerId',
          paramValue: customerId,
          paramType: typeof customerId,
        },
        {
          paramName: 'subscriptionId',
          paramValue: 'subscriptionId',
          paramType: typeof subscriptionId,
        },
      ],
      additionalMessage: 'Active Extension Updated Successfully',
      startLogId,
    });

    return {
      message: 'Active Extension Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err?._message === 'ActiveExtension validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateActiveExtension',
        functionParams: [
          {
            paramName: 'activeExtensionData',
            paramValue: activeExtensionData,
            paramType: typeof activeExtensionData,
          },
          {
            paramName: 'customerId',
            paramValue: customerId,
            paramType: typeof customerId,
          },
          {
            paramName: 'subscriptionId',
            paramValue: 'subscriptionId',
            paramType: typeof subscriptionId,
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
      functionName: 'updateActiveExtension',
      functionParams: [
        {
          paramName: 'activeExtensionData',
          paramValue: activeExtensionData,
          paramType: typeof activeExtensionData,
        },
        {
          paramName: 'customerId',
          paramValue: customerId,
          paramType: typeof customerId,
        },
        {
          paramName: 'subscriptionId',
          paramValue: 'subscriptionId',
          paramType: typeof subscriptionId,
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
