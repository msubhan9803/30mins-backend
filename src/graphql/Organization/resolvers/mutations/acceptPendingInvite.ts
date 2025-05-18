import escapeStringRegexp from 'escape-string-regexp';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import Organization from '../../../../MongoModels/Organization';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function acceptPendingInvite(
  parent,
  {token, organizationId, pendingInviteId},
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
      functionName: 'acceptPendingInvite',
      functionParams: [
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
          paramName: 'inviterUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const inviteeUser = await User.findById(decodedToken.UserId).exec();

    const safeInviteeEmail = escapeStringRegexp(inviteeUser.accountDetails.email);
    const pattern = `^${safeInviteeEmail}$`;
    const inviteeEmailRegex = new RegExp(pattern, 'i');

    const existingInvite = await PendingInvite.exists({
      inviteeEmail: {$regex: inviteeEmailRegex},
      organizationId,
      _id: pendingInviteId,
    });

    if (!existingInvite) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'acceptPendingInvite',
        functionParams: [
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
            paramName: 'inviterUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'No Pending Invite exists for this User',
        startLogId,
      });

      return {
        message: 'No Pending Invite exists for this User',
        status: 404,
      };
    }

    const userInOrg = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId,
    });

    if (userInOrg) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'acceptPendingInvite',
        functionParams: [
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
            paramName: 'inviterUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'User is already in this organization',
        startLogId,
      });

      return {
        message: 'User is already in this organization',
        status: 400,
      };
    }

    const createdMember = await OrganizationMembership.create({
      userId: decodedToken.UserId,
      organizationId: organizationId,
      role: 'member',
    });

    const updatedOrganization = await Organization.findByIdAndUpdate(organizationId, {
      $push: {
        members: createdMember.userId,
      },
    })
      .orFail(() => new Error('Organization Document Not Found'))
      .exec();

    await PendingInvite.findByIdAndDelete(pendingInviteId);

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'acceptPendingInvite',
      functionParams: [
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
          paramName: 'inviterUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Accepted Invite Successfully',
      startLogId,
    });

    return {
      message: 'Accepted Invite Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'acceptPendingInvite',
        functionParams: [
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
      functionName: 'acceptPendingInvite',
      functionParams: [
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
          paramName: 'inviterUserId',
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
