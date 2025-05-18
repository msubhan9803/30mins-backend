import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {BW_LIST} from '../../../../constants/enums';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import Service from '../../../../MongoModels/Service';

export default async function checkEmailFilter(
  parent,
  {serviceID, bookerEmail, providerID},
  context,
  info
) {
  let startLogId: String;

  try {
    const SECRETS = await AwsSecrets.getInstance();
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'checkEmailFilter',
        functionParams: [
          {
            paramName: 'serviceID',
            paramValue: serviceID,
            paramType: typeof serviceID,
          },
          {
            paramName: 'bookerEmail',
            paramValue: 'bookerEmail',
            paramType: typeof bookerEmail,
          },
          {
            paramName: 'providerID',
            paramValue: 'providerID',
            paramType: typeof providerID,
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
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'checkEmailFilter',
      functionParams: [
        {
          paramName: 'serviceID',
          paramValue: serviceID,
          paramType: typeof serviceID,
        },
        {
          paramName: 'bookerEmail',
          paramValue: 'bookerEmail',
          paramType: typeof bookerEmail,
        },
        {
          paramName: 'providerID',
          paramValue: 'providerID',
          paramType: typeof providerID,
        },
      ],
    });

    const hasExtension = await ActiveExtension.exists({
      userId: providerID,
      extensionProductId: stripeProductIDs.EXTENSIONS.BLACK_WHITE_LIST,
      status: {
        $in: ['paid', 'gifted'],
      },
    });

    if (hasExtension) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'checkEmailFilter',
        functionParams: [
          {
            paramName: 'serviceID',
            paramValue: serviceID,
            paramType: typeof serviceID,
          },
          {
            paramName: 'bookerEmail',
            paramValue: 'bookerEmail',
            paramType: typeof bookerEmail,
          },
          {
            paramName: 'providerID',
            paramValue: 'providerID',
            paramType: typeof providerID,
          },
        ],
        additionalMessage: 'Provider has BLACK_WHITE_LIST Extension',
        startLogId,
      });

      const serviceEmailFilter = await Service.findOne(
        {
          _id: serviceID,
        },
        ['emailFilter']
      ).orFail(() => new Error('Service Document Not Found'));

      if (serviceEmailFilter?.emailFilter) {
        const emailFiltered = serviceEmailFilter.emailFilter.emails.includes(bookerEmail);
        const domainFiltered = serviceEmailFilter.emailFilter.domains.some(val =>
          bookerEmail.split('@').includes(val)
        );

        if (
          serviceEmailFilter.emailFilter.type === BW_LIST.BLACK_LIST &&
          (emailFiltered || domainFiltered)
        ) {
          await createApiLog({
            type: ApiLogTypes.QUERY_END,
            level: ApiLogLevels.ERROR,
            functionName: 'checkEmailFilter',
            functionParams: [
              {
                paramName: 'serviceID',
                paramValue: serviceID,
                paramType: typeof serviceID,
              },
              {
                paramName: 'bookerEmail',
                paramValue: 'bookerEmail',
                paramType: typeof bookerEmail,
              },
              {
                paramName: 'providerID',
                paramValue: 'providerID',
                paramType: typeof providerID,
              },
            ],
            additionalMessage: `This ${
              emailFiltered ? 'email' : 'domain'
            } is Blocked by the Provider user.`,
            startLogId,
          });

          return {
            message: `This ${emailFiltered ? 'email' : 'domain'} is Blocked by the Provider user.`,
            status: 401,
          };
        } else if (
          serviceEmailFilter.emailFilter.type === BW_LIST.WHITE_LIST &&
          !emailFiltered &&
          !domainFiltered
        ) {
          await createApiLog({
            type: ApiLogTypes.QUERY_END,
            level: ApiLogLevels.ERROR,
            functionName: 'checkEmailFilter',
            functionParams: [
              {
                paramName: 'serviceID',
                paramValue: serviceID,
                paramType: typeof serviceID,
              },
              {
                paramName: 'bookerEmail',
                paramValue: 'bookerEmail',
                paramType: typeof bookerEmail,
              },
              {
                paramName: 'providerID',
                paramValue: 'providerID',
                paramType: typeof providerID,
              },
            ],
            additionalMessage: `This ${
              !emailFiltered ? 'email' : 'domain'
            } is not in the whitelist.`,
            startLogId,
          });
          return {
            message: `This ${!emailFiltered ? 'email' : 'domain'} is not in the whitelist.`,
            status: 401,
          };
        }
      }
    }

    return {
      message: 'Email Validation Passed',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'checkEmailFilter',
        functionParams: [
          {
            paramName: 'serviceID',
            paramValue: serviceID,
            paramType: typeof serviceID,
          },
          {
            paramName: 'bookerEmail',
            paramValue: 'bookerEmail',
            paramType: typeof bookerEmail,
          },
          {
            paramName: 'providerID',
            paramValue: 'providerID',
            paramType: typeof providerID,
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

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'checkEmailFilter',
      functionParams: [
        {
          paramName: 'serviceID',
          paramValue: serviceID,
          paramType: typeof serviceID,
        },
        {
          paramName: 'bookerEmail',
          paramValue: 'bookerEmail',
          paramType: typeof bookerEmail,
        },
        {
          paramName: 'providerID',
          paramValue: 'providerID',
          paramType: typeof providerID,
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
