import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import StripeAccount from '../../../../MongoModels/StripeAccount';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function updateStripeAccount(parent, {stripeAccountData}, context, info) {
  let startLogId: String;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateStripeAccount',
      functionParams: [
        {
          paramName: 'stripeAccountData',
          paramValue: stripeAccountData,
          paramType: typeof stripeAccountData,
        },
      ],
    });

    const {userId} = stripeAccountData;

    await StripeAccount.findOneAndUpdate(
      {
        userId,
      },
      {
        $set: {
          ...stripeAccountData,
        },
      }
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateStripeAccount',
      functionParams: [
        {
          paramName: 'stripeAccountData',
          paramValue: stripeAccountData,
          paramType: typeof stripeAccountData,
        },
      ],
      additionalMessage: 'Stripe Account Updated Successfully',
      startLogId,
    });

    return {
      message: 'Stripe Account Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err?._message === 'StripeAccount validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateStripeAccount',
        functionParams: [
          {
            paramName: 'stripeAccountData',
            paramValue: stripeAccountData,
            paramType: typeof stripeAccountData,
          },
        ],
        additionalMessage: 'Mongoose StripeAccount Validation Failed',
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
      functionName: 'updateStripeAccount',
      functionParams: [
        {
          paramName: 'stripeAccountData',
          paramValue: stripeAccountData,
          paramType: typeof stripeAccountData,
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
