import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {v4 as uuid} from 'uuid';
import BookingApprovals from '../../../../MongoModels/BookingApprovals';

export default async function requestBookingApprovals(
  _,
  {serviceId, bookerEmail, providerEmail, providerName, bookerName},
  context
) {
  let startLogId: String = '';
  const {token} = context;
  const functionParams = [
    {
      paramName: 'serviceId',
      paramValue: serviceId,
      paramType: typeof serviceId,
    },
    {
      paramName: 'bookerEmail',
      paramValue: bookerEmail,
      paramType: typeof bookerEmail,
    },
    {
      paramName: 'providerEmail',
      paramValue: providerEmail,
      paramType: typeof providerEmail,
    },
    {
      paramName: 'token',
      paramValue: 'HIDDEN_TOKEN',
      paramType: typeof token,
    },
  ];
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'RequestBookingApprovals',
      functionParams: functionParams,
      additionalMessage: 'Starting Mutation',
    });
    const SECRETS = await AwsSecrets.getInstance();
    if (token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'RequestBookingApprovals',
        functionParams: functionParams,
        additionalMessage: 'Invalid Permissions: Invalid API Key',
        startLogId,
      });
      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }
    await BookingApprovals.findOneAndDelete({
      service: serviceId,
      providerEmail: providerEmail,
      bookerEmail: bookerEmail,
    });

    const bookingApproval = await BookingApprovals.create({
      service: serviceId,
      providerEmail: providerEmail,
      bookerEmail: bookerEmail,
      providerName: providerName,
      bookerName: bookerName,
      authcode: uuid(),
      approved: false,
      denied: false,
      approvalRequested: true,
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'RequestBookingApprovals',
      functionParams: functionParams,
      additionalMessage: 'Approval requested.',
      startLogId,
    });

    return {
      authcode: bookingApproval.authcode,
      response: {
        message: 'Approval requested.',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'RequestBookingApprovals',
      functionParams: functionParams,
      additionalMessage: err.message,
      startLogId,
    });
    return {
      response: {message: err.message, status: 500},
    };
  }
}
