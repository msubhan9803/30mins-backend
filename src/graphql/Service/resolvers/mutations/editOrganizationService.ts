import Service from '../../../../MongoModels/Service';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {PAYMENT_TYPES} from '../../../../constants/enums';

export default async function editOrganizationService(
  parent,
  {organizationServiceData, documentId, token},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'editOrganizationService',
      functionParams: [
        {
          paramName: 'organizationServiceData',
          paramValue: organizationServiceData,
          paramType: typeof organizationServiceData,
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
      description,
      image,
      duration,
      isPrivate,
      price,
      currency,
      percentDonated,
      charity,
      reminders,
      recurringInterval,
      isRecurring,
      conferenceType,
      searchTags,
      media,
      paymentType,
      isPaid,
      isOrgService,
      organizationId,
      organizationName,
      orgServiceCategory,
      serviceWorkingHours,
      bookingQuestions,
      emailFilter,
      serviceType,
      blackList,
      whiteList,
      otpProtected,
      authenticationType,
    } = organizationServiceData;

    if (isPaid && currency !== '$' && paymentType === PAYMENT_TYPES.ESCROW) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrganizationService',
        functionParams: [
          {
            paramName: 'organizationServiceData',
            paramValue: organizationServiceData,
            paramType: typeof organizationServiceData,
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
        functionName: 'editOrganizationService',
        functionParams: [
          {
            paramName: 'organizationServiceData',
            paramValue: organizationServiceData,
            paramType: typeof organizationServiceData,
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
        additionalMessage: 'Duplicate Slug',
        startLogId,
      });

      return {
        message: 'Duplicate Slug',
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
          description,
          duration,
          image,
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
          isOrgService,
          organizationId,
          organizationName,
          orgServiceCategory,
          serviceWorkingHours,
          bookingQuestions,
          emailFilter,
          serviceType,
          blackList,
          otpProtected,
          whiteList,
          authenticationType,
        },
      },
      {runValidators: true}
    )
      .orFail(() => new Error('Organization Service Document Not Found'))
      .exec();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'editOrganizationService',
      functionParams: [
        {
          paramName: 'organizationServiceData',
          paramValue: organizationServiceData,
          paramType: typeof organizationServiceData,
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
      additionalMessage: 'Organization Service Updated Successfully',
      startLogId,
    });

    return {
      message: 'Organization Service Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrganizationService',
        functionParams: [
          {
            paramName: 'organizationServiceData',
            paramValue: organizationServiceData,
            paramType: typeof organizationServiceData,
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
        functionName: 'editOrganizationService',
        functionParams: [
          {
            paramName: 'organizationServiceData',
            paramValue: organizationServiceData,
            paramType: typeof organizationServiceData,
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
      functionName: 'editOrganizationService',
      functionParams: [
        {
          paramName: 'organizationServiceData',
          paramValue: organizationServiceData,
          paramType: typeof organizationServiceData,
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
