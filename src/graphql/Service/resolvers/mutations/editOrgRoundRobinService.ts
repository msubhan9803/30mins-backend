import {SERVICE_TYPES} from '../../../../constants/enums';
import Service from '../../../../MongoModels/Service';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';

export default async function editOrgRoundRobinService(
  parent,
  {roundRobinServiceData, documentId},
  context,
  _info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'editOrgRoundRobinService',
      functionParams: [
        {
          paramName: 'roundRobinServiceData',
          paramValue: roundRobinServiceData,
          paramType: typeof roundRobinServiceData,
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
      price,
      currency,
      reminders,
      recurringInterval,
      isRecurring,
      conferenceType,
      searchTags,
      media,
      isOrgService,
      organizationId,
      organizationName,
      orgServiceCategory,
      serviceWorkingHours,
      bookingQuestions,
      blackList,
      whiteList,
      roundRobinTeam,
      authenticationType,
      otpProtected,
    } = roundRobinServiceData;

    if (roundRobinTeam) {
      const roundRobinExist = await RoundRobinTeam.exists({
        _id: roundRobinTeam,
        organizationId: organizationId,
      });
      if (!roundRobinExist) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_START,
          level: ApiLogLevels.ERROR,
          functionName: 'editOrgRoundRobinService',
          functionParams: [
            {
              paramName: 'roundRobinServiceData',
              paramValue: roundRobinServiceData,
              paramType: typeof roundRobinServiceData,
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
          additionalMessage: 'The round robin team does not exist',
          startLogId,
        });

        return {
          message: 'The round robin team does not exist',
          status: 401,
        };
      }
    }

    const hasPermission = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId: organizationId,
      role: {$in: ['admin', 'owner']},
    });

    if (!hasPermission) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrgRoundRobinService',
        functionParams: [
          {
            paramName: 'roundRobinServiceData',
            paramValue: roundRobinServiceData,
            paramType: typeof roundRobinServiceData,
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
        additionalMessage: 'The user is neither in Organization nor Admin',
        startLogId,
      });

      return {
        message: 'The user is neither in Organization nor Admin',
        status: 401,
      };
    }

    const safeSlug = escapeStringRegexp(slug);
    const pattern = `^${safeSlug}$`;
    const regex = new RegExp(pattern, 'i');

    const dupeSlug = await Service.exists({
      _id: {$ne: documentId},
      organizationId: organizationId,
      slug: {$regex: regex},
    });
    if (dupeSlug) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrgRoundRobinService',
        functionParams: [
          {
            paramName: 'roundRobinServiceData',
            paramValue: roundRobinServiceData,
            paramType: typeof roundRobinServiceData,
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

    const isValidService = await Service.exists({
      _id: documentId,
      organizationId: organizationId,
      serviceType: SERVICE_TYPES.ROUND_ROBIN,
    });
    if (!isValidService) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrgRoundRobinService',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'roundRobinServiceData',
            paramValue: roundRobinServiceData,
            paramType: typeof roundRobinServiceData,
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
        additionalMessage: 'Invalid Service!',
        startLogId,
      });

      return {
        message: 'Invalid Service!',
        status: 401,
      };
    }

    await Service.findByIdAndUpdate(
      documentId,
      {
        $set: {
          title,
          slug,
          description,
          duration,
          image,
          isPrivate: !roundRobinTeam ? true : false,
          price,
          currency,
          percentDonated: undefined,
          charity: undefined,
          reminders,
          isRecurring,
          recurringInterval,
          conferenceType,
          searchTags,
          'media.type': media?.type,
          'media.link': media?.link,
          paymentType: undefined,
          isPaid: false,
          isOrgService,
          organizationId,
          organizationName,
          orgServiceCategory,
          serviceWorkingHours,
          bookingQuestions,
          blackList,
          whiteList,
          otpProtected,
          roundRobinTeam,
          authenticationType,
        },
      },
      {runValidators: true}
    ).orFail(() => new Error('Organization Service Document Not Found'));

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'editOrgRoundRobinService',
      functionParams: [
        {
          paramName: 'roundRobinServiceData',
          paramValue: roundRobinServiceData,
          paramType: typeof roundRobinServiceData,
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
      additionalMessage: 'Round Robin Organization Service Updated Successfully',
      startLogId,
    });

    return {
      message: 'Round Robin Organization Service Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrgRoundRobinService',
        functionParams: [
          {
            paramName: 'roundRobinServiceData',
            paramValue: roundRobinServiceData,
            paramType: typeof roundRobinServiceData,
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
        functionName: 'editOrgRoundRobinService',
        functionParams: [
          {
            paramName: 'roundRobinServiceData',
            paramValue: roundRobinServiceData,
            paramType: typeof roundRobinServiceData,
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
      functionName: 'editOrgRoundRobinService',
      functionParams: [
        {
          paramName: 'roundRobinServiceData',
          paramValue: roundRobinServiceData,
          paramType: typeof roundRobinServiceData,
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
