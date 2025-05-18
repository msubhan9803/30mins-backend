import {SERVICE_TYPES} from './../../../../constants/enums';
import Service from '../../../../MongoModels/Service';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {PAYMENT_TYPES} from '../../../../constants/enums';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

export default async function removeRoundRobinTeamFromService(
  parent,
  {serviceId, organizationId},
  context,
  info
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
      functionName: 'removeRoundRobinTeamFromService',
      functionParams: [
        {
          paramName: 'serviceId',
          paramValue: serviceId,
          paramType: typeof serviceId,
        },
        {
          paramName: 'organzinationId',
          paramValue: organizationId,
          paramType: typeof organizationId,
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

    const isValidService = await Service.exists({
      _id: serviceId,
      organizationId: organizationId,
      serviceType: SERVICE_TYPES.ROUND_ROBIN,
    });
    if (!isValidService) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.ERROR,
        functionName: 'removeRoundRobinTeamFromService',
        functionParams: [
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'organizationId',
            paramValue: organizationId,
            paramType: typeof organizationId,
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
        additionalMessage: 'Invalid service !',
        startLogId,
      });

      return {
        message: 'Invalid service !',
        status: 401,
      };
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
        functionName: 'removeRoundRobinTeamFromService',
        functionParams: [
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'organizationId',
            paramValue: organizationId,
            paramType: typeof organizationId,
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
        additionalMessage: 'The user is neither in Organization Nor Admin',
        startLogId,
      });

      return {
        message: 'The user is neither in Organization Nor Admin',
        status: 401,
      };
    }

    const updatedService = await Service.findByIdAndUpdate(serviceId, {
      $set: {
        isPrivate: true,
        roundRobinTeam: null,
      },
    }).orFail(() => new Error('Round Robin Organization Service Document Not Found'));

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'removeRoundRobinTeamFromService',
      functionParams: [
        {
          paramName: 'serviceId',
          paramValue: serviceId,
          paramType: typeof serviceId,
        },
        {
          paramName: 'organizationId',
          paramValue: organizationId,
          paramType: typeof organizationId,
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
      additionalMessage: 'Round Robin Organization Service Removed Team Successfully',
      startLogId,
    });

    return {
      message: 'Round Robin Organization Service Removed Team Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'removeRoundRobinTeamFromService',
        functionParams: [
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'organizationId',
            paramValue: organizationId,
            paramType: typeof organizationId,
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
        functionName: 'removeRoundRobinTeamFromService',
        functionParams: [
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'organizationId',
            paramValue: organizationId,
            paramType: typeof organizationId,
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
      functionName: 'removeRoundRobinTeamFromService',
      functionParams: [
        {
          paramName: 'serviceId',
          paramValue: serviceId,
          paramType: typeof serviceId,
        },
        {
          paramName: 'organizationId',
          paramValue: organizationId,
          paramType: typeof organizationId,
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
