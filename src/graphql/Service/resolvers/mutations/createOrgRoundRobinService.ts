import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SERVICE_TYPES} from '../../../../constants/enums';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';

export default async function createOrgRoundRobinService(
  parent,
  {roundRobinServiceData},
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
      functionName: 'createOrgRoundRobinService',
      functionParams: [
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
      otpProtected,
      authenticationType,
    } = roundRobinServiceData;

    const hasPermission = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId: organizationId,
      role: {$in: ['owner', 'admin']},
    });
    if (!hasPermission) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrgRoundRobinService',
        functionParams: [
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
        additionalMessage: 'Not Authenticated:  The user does not have the create permission',
        startLogId,
      });

      return {
        message: 'Not Authenticated: The user does not have the create permission',
        status: 401,
      };
    }

    if (roundRobinTeam) {
      const roundRobinExist = await RoundRobinTeam.exists({
        _id: roundRobinTeam,
        organizationId: organizationId,
      });
      if (!roundRobinExist) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_START,
          level: ApiLogLevels.ERROR,
          functionName: 'createOrgRoundRobinService',
          functionParams: [
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
          additionalMessage: 'The round robin team does not exist',
          startLogId,
        });

        return {
          message: 'The round robin team does not exist',
          status: 401,
        };
      }
    }

    const userInOrg = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId: organizationId,
    });

    if (!userInOrg) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrgRoundRobinService',
        functionParams: [
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
        additionalMessage: 'User is not in Organization',
        startLogId,
      });

      return {
        message: 'User is not in Organization',
        status: 401,
      };
    }

    const safeSlug = escapeStringRegexp(slug);
    const pattern = `^${safeSlug}$`;
    const regex = new RegExp(pattern, 'i');

    const dupeSlug = await Service.exists({
      organizationId: organizationId,
      slug: {$regex: regex},
    });

    if (dupeSlug) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrgRoundRobinService',
        functionParams: [
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
        additionalMessage: 'Duplicate Slug',
        startLogId,
      });

      return {
        message: 'Duplicate Slug',
        status: 409,
      };
    }

    const createdService = await Service.create({
      userId: decodedToken.UserId,
      title,
      slug,
      image,
      description,
      duration,
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
      roundRobinTeam,
      otpProtected,
      authenticationType,
      serviceType: SERVICE_TYPES.ROUND_ROBIN,
    });

    await User.findByIdAndUpdate(decodedToken.UserId, {
      $push: {
        services: createdService._id,
      },
    }).orFail(() => new Error('User Document Not Found'));

    await Organization.findByIdAndUpdate(organizationId, {
      $push: {
        services: createdService._id,
      },
    }).orFail(() => new Error('Organization Document Not Found'));

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createOrgRoundRobinService',
      functionParams: [
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
      additionalMessage: 'Organization Round Robin Service Created Successfully',
      startLogId,
    });

    return {
      message: 'Round Robin Organization Service Created Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrgRoundRobinService',
        functionParams: [
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
        functionName: 'createOrgRoundRobinService',
        functionParams: [
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
      functionName: 'createOrgRoundRobinService',
      functionParams: [
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
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
