import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import BookingApprovals from '../../../../MongoModels/BookingApprovals';
import dayjs from 'dayjs';
import Service from '../../../../MongoModels/Service';

export default async function RequestBookingAllow(_, {authcode}, context) {
  let startLogId: String = '';
  const {token} = context;
  const functionParams = [
    {
      paramName: 'authcode',
      paramValue: authcode,
      paramType: typeof authcode,
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
      functionName: 'RequestBookingAllow',
      functionParams: functionParams,
      additionalMessage: 'Starting Mutation',
    });
    const SECRETS = await AwsSecrets.getInstance();
    if (token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'RequestBookingAllow',
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

    const bookingApproval = await BookingApprovals.findOne({
      authcode: authcode,
    });

    if (!bookingApproval) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'RequestBookingAllow',
        functionParams: functionParams,
        additionalMessage: 'Approval Request Not Found.',
        startLogId,
      });
      return {
        response: {
          status: 404,
          message: 'Approval Request Not Found.',
        },
      };
    }

    if (dayjs().isAfter(dayjs(bookingApproval.createdAt).add(2, 'day'), 'day')) {
      await BookingApprovals.deleteOne({
        authcode: authcode,
      });
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'RequestBookingAllow',
        functionParams: functionParams,
        additionalMessage: 'Three days have been passed. Action is not permitted.',
        startLogId,
      });
      return {
        response: {
          message: 'Three days have been passed. Action is not permitted.',
          status: 400,
        },
      };
    }

    if (bookingApproval.denied) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'RequestBookingAllow',
        functionParams: functionParams,
        additionalMessage:
          'Booker has been previously denied access. Wait 24 hours and then initiate the request again.',
        startLogId,
      });
      return {
        response: {
          status: 400,
          message:
            'Booker has been previously denied access. Wait 24 hours and then initiate the request again.',
        },
      };
    }

    if (!dayjs().isAfter(dayjs(bookingApproval.createdAt).add(2, 'day'), 'day')) {
      await BookingApprovals.findOne({
        authcode: authcode,
      });

      const service = await Service.findOne({
        _id: bookingApproval.service,
      });

      const bookerEmailDomain = bookingApproval.bookerEmail.split('@')[1];

      for (let i = 0; i < service.whiteList.domains.length; i++) {
        if (service.whiteList.domains[i] === bookerEmailDomain) {
          return {
            approved: true,
            response: {
              message: 'Domain of booker is found in whitelist',
              status: 400,
            },
          };
        }
      }

      for (let i = 0; i < service.whiteList.emails.length; i++) {
        if (service.whiteList.emails[i] === bookingApproval.bookerEmail) {
          return {
            approved: true,
            response: {
              message: 'Email of booker is found in whitelist',
              status: 400,
            },
          };
        }
      }

      service.whiteList.emails.push(bookingApproval.bookerEmail);

      const serviceUpdatedObject = {...service._doc};

      await Service.findOneAndUpdate(
        {
          _id: bookingApproval.service,
        },
        {
          $set: {
            ...serviceUpdatedObject,
          },
        }
      );

      const bookingApprovalUpdatedObject = {...bookingApproval._doc, approved: true};

      await BookingApprovals.deleteOne({
        authcode: authcode,
      });

      const {providerName, bookerName, providerEmail, bookerEmail} = bookingApprovalUpdatedObject;

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'RequestBookingAllow',
        functionParams: functionParams,
        additionalMessage: 'Email of booker is added in whitelist',
        startLogId,
      });

      return {
        approved: true,
        providerName: providerName,
        bookerName: bookerName,
        providerEmail: providerEmail,
        bookerEmail: bookerEmail,
        response: {
          message: 'Email of booker is added in whitelist',
          status: 200,
        },
      };
    }
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'RequestBookingAllow',
      functionParams: functionParams,
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {message: err.message, status: 500},
    };
  }
}
