import Service from '../../../../MongoModels/Service';

import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {PAYMENT_TYPES} from '../../../../constants/enums';

export default async function backendEditService(
  parent,
  {serviceData, serviceId, userId},
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
        functionName: 'backendUpdateUser',
        functionParams: [
          {paramName: 'serviceData', paramValue: serviceData, paramType: typeof serviceData},
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
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
      functionName: 'backendEditService',
      functionParams: [
        {paramName: 'serviceData', paramValue: serviceData, paramType: typeof serviceData},
        {
          paramName: 'serviceId',
          paramValue: serviceId,
          paramType: typeof serviceId,
        },
        {
          paramName: 'userId',
          paramValue: userId,
          paramType: typeof userId,
        },
      ],
    });

    const {
      title,
      slug,
      image,
      description,
      duration,
      isPrivate,
      price,
      currency,
      percentDonated,
      charity,
      reminders,
      isRecurring,
      recurringInterval,
      conferenceType,
      searchTags,
      media,
      paymentType,
      isPaid,
      serviceWorkingHours,
      bookingQuestions,
      emailFilter,
      serviceType,
      otpProtected,
    } = serviceData;

    if (isPaid && currency !== '$' && paymentType === PAYMENT_TYPES.ESCROW) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'backendEditService',
        functionParams: [
          {paramName: 'serviceData', paramValue: serviceData, paramType: typeof serviceData},

          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
        additionalMessage: 'Escrow Only Supports USD Currency',
        startLogId,
      });

      return {
        message: 'Escrow Only Supports USD Currency',
        status: 400,
      };
    }

    const safeSlug = escapeStringRegexp(slug);
    const pattern = `^${safeSlug}$`;
    const regex = new RegExp(pattern, 'i');

    const dupeSlug = await Service.exists({
      _id: {$ne: serviceId},
      userId: userId,
      slug: {$regex: regex},
    });

    if (dupeSlug) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'backendEditService',
        functionParams: [
          {paramName: 'serviceData', paramValue: serviceData, paramType: typeof serviceData},
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
        additionalMessage: 'This slug is being used by another service currently.',
        startLogId,
      });

      return {
        message: 'This slug is being used by another service currently.',
        status: 409,
      };
    }

    const updatedService = await Service.findOneAndUpdate(
      {
        _id: serviceId,
      },
      {
        $set: {
          title,
          slug,
          image,
          description,
          duration,
          isPrivate,
          price,
          currency,
          percentDonated: paymentType !== PAYMENT_TYPES.MANUAL ? percentDonated : undefined,
          charity: paymentType !== PAYMENT_TYPES.MANUAL ? charity : undefined,
          reminders,
          isRecurring,
          recurringInterval,
          conferenceType,
          searchTags,
          'media.type': media?.type,
          'media.link': media?.link,
          paymentType: isPaid ? paymentType : undefined,
          isPaid,
          serviceWorkingHours,
          bookingQuestions,
          emailFilter,
          serviceType,
          otpProtected,
        },
      },
      {runValidators: true}
    );

    if (!updatedService) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'backendEditService',
        functionParams: [
          {paramName: 'serviceData', paramValue: serviceData, paramType: typeof serviceData},
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
        additionalMessage: 'Document Not Found',
        startLogId,
      });

      return {
        message: 'Document Not Found',
        status: 404,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'backendEditService',
      functionParams: [
        {paramName: 'serviceData', paramValue: serviceData, paramType: typeof serviceData},
        {
          paramName: 'serviceId',
          paramValue: serviceId,
          paramType: typeof serviceId,
        },
        {
          paramName: 'userId',
          paramValue: userId,
          paramType: typeof userId,
        },
      ],
      additionalMessage: 'Service Updated Successfully',
      startLogId,
    });

    return {
      message: 'Service Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err?._message === 'Service validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'backendEditService',
        functionParams: [
          {paramName: 'serviceData', paramValue: serviceData, paramType: typeof serviceData},
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
        additionalMessage: 'Mongoose Service Validation Failed',
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
      functionName: 'backendEditService',
      functionParams: [
        {paramName: 'serviceData', paramValue: serviceData, paramType: typeof serviceData},
        {
          paramName: 'serviceId',
          paramValue: serviceId,
          paramType: typeof serviceId,
        },
        {
          paramName: 'userId',
          paramValue: userId,
          paramType: typeof userId,
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
