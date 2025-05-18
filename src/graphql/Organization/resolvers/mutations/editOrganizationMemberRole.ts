import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function editOrganizationMemberRole(
  parent,
  {token, organizationMembershipId, organizationId, role},
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
      functionName: 'editOrganizationMemberRole',
      functionParams: [
        {
          paramName: 'organizationMembershipId',
          paramValue: organizationMembershipId,
          paramType: typeof organizationMembershipId,
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

    let hasEditPermission: boolean = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId: organizationId,
      role: {$in: ['owner']},
    });

    if (!hasEditPermission) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrganizationMemberRole',
        functionParams: [
          {
            paramName: 'organizationMembershipId',
            paramValue: organizationMembershipId,
            paramType: typeof organizationMembershipId,
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
        additionalMessage: 'Not Authenticated: User Lacks Edit Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const updatedOrganizationMember = await OrganizationMembership.findOneAndUpdate(
      {
        _id: organizationMembershipId,
        organizationId,
      },
      {
        role,
      }
    )
      .orFail(() => new Error('Organization Membership Document Not Found'))
      .exec();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'editOrganizationMemberRole',
      functionParams: [
        {
          paramName: 'organizationMembershipId',
          paramValue: organizationMembershipId,
          paramType: typeof organizationMembershipId,
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
      additionalMessage: 'Updated Organization Member Successfully',
      startLogId,
    });

    return {
      message: 'Updated Organization Member Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrganizationMemberRole',
        functionParams: [
          {
            paramName: 'organizationMembershipId',
            paramValue: organizationMembershipId,
            paramType: typeof organizationMembershipId,
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

    if (err?._message === 'OrganizationMembership validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editOrganizationMemberRole',
        functionParams: [
          {
            paramName: 'organizationMembershipId',
            paramValue: organizationMembershipId,
            paramType: typeof organizationMembershipId,
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
        additionalMessage: 'Mongoose OrganizationMembership Validation Failed',
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
      functionName: 'editOrganizationMemberRole',
      functionParams: [
        {
          paramName: 'organizationMembershipId',
          paramValue: organizationMembershipId,
          paramType: typeof organizationMembershipId,
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
