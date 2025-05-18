import {SERVICE_TYPES} from './../../../../constants/enums';
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';
import Organization from '../../../../MongoModels/Organization';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import deleteImageFromBucket from '../../../../utils/deleteImageFromBucket';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

export default async function deleteOrgRoundRobinService(
  parent,
  {documentId, organizationId},
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
      functionName: 'deleteOrgRoundRobinService',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
    });

    const isValidService = await Service.exists({
      _id: documentId,
      organizationId: organizationId,
      serviceType: SERVICE_TYPES.ROUND_ROBIN,
    });
    if (!isValidService) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteOrgRoundRobinService',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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
        additionalMessage: 'Invalid Service!',
        startLogId,
      });

      return {
        message: 'Invalid Service!',
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
        functionName: 'deleteOrgRoundRobinService',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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
        additionalMessage: 'The user is neither in Organization nor Admin',
        startLogId,
      });

      return {
        message: 'The user is neither in Organization nor Admin',
        status: 401,
      };
    }

    const deletedService = await Service.findByIdAndDelete(documentId);

    if (deletedService?.image) {
      await deleteImageFromBucket(deletedService.image);
    }

    const updatedUser = await User.findByIdAndUpdate(decodedToken.UserId, {
      $pull: {
        services: deletedService._id,
      },
    }).orFail(() => new Error('User Document Not Found'));

    const updatedOrganization = await Organization.findByIdAndUpdate(
      deletedService.organizationId,
      {
        $pull: {
          services: deletedService._id,
        },
      }
    ).orFail(() => new Error('Organization Document Not Found'));

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'deleteOrgRoundRobinService',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
      additionalMessage: 'Organization Service Deleted Successfully',
      startLogId,
    });

    return {
      message: 'Organization Service Deleted Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteOrgRoundRobinService',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'deleteOrgRoundRobinService',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
