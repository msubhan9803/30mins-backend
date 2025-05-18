import Service from '../../../../MongoModels/Service';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {PAYMENT_TYPES, SERVICE_TYPES} from '../../../../constants/enums';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';

export default async function editService(parent, {serviceData, documentId, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'editService',
      functionParams: [
        {
          paramName: 'serviceData',
          paramValue: serviceData,
          paramType: typeof serviceData,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
      charityId,
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
      attendeeLimit,
      blackList,
      whiteList,
      dueDate,
      otpProtected,
      authenticationType,
    } = serviceData;

    const hasPaidMeetingExtension = await ActiveExtension.exists({
      userId: decodedToken.UserId,
      extensionProductId: {
        $in: [stripeProductIDs.EXTENSIONS.PAID_MEETINGS],
      },
      status: {
        $in: ['paid', 'gifted'],
      },
    });

    if (
      (price > 0 || isPaid) &&
      !hasPaidMeetingExtension &&
      serviceType === SERVICE_TYPES.MEETING
    ) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editService',
        functionParams: [
          {
            paramName: 'serviceData',
            paramValue: serviceData,
            paramType: typeof serviceData,
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
        additionalMessage: 'Missing Paid Meeting Extension',
        startLogId,
      });

      return {
        message: 'Missing Paid Meeting Extension',
        status: 400,
      };
    }

    if (isPaid && currency !== '$' && paymentType === PAYMENT_TYPES.ESCROW) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editService',
        functionParams: [
          {
            paramName: 'serviceData',
            paramValue: serviceData,
            paramType: typeof serviceData,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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
      _id: {$ne: documentId},
      userId: decodedToken.UserId,
      slug: {$regex: regex},
    });

    if (dupeSlug) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editService',
        functionParams: [
          {
            paramName: 'serviceData',
            paramValue: serviceData,
            paramType: typeof serviceData,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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
        userId: decodedToken.UserId,
        _id: documentId,
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
          charityId: charityId && paymentType !== PAYMENT_TYPES.MANUAL ? charityId : undefined,
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
          attendeeLimit,
          blackList,
          whiteList,
          dueDate,
          otpProtected,
          authenticationType,
        },
      },
      {runValidators: true}
    );

    if (!updatedService) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editService',
        functionParams: [
          {
            paramName: 'serviceData',
            paramValue: serviceData,
            paramType: typeof serviceData,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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
      functionName: 'editService',
      functionParams: [
        {
          paramName: 'serviceData',
          paramValue: serviceData,
          paramType: typeof serviceData,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
      additionalMessage: 'Service Updated Successfully',
      startLogId,
    });

    return {
      message: 'Service Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editService',
        functionParams: [
          {
            paramName: 'serviceData',
            paramValue: serviceData,
            paramType: typeof serviceData,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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

    if (err?._message === 'Service validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editService',
        functionParams: [
          {
            paramName: 'serviceData',
            paramValue: serviceData,
            paramType: typeof serviceData,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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
      functionName: 'editService',
      functionParams: [
        {
          paramName: 'serviceData',
          paramValue: serviceData,
          paramType: typeof serviceData,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
