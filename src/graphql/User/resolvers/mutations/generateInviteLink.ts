import escapeStringRegexp from 'escape-string-regexp';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import cuid from 'cuid';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function generateInviteLink(
  parent,
  {token, inviteeEmail, inviteeName},
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
      functionName: 'generateInviteLink',
      functionParams: [
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
        {
          paramName: 'inviteeEmail',
          paramValue: inviteeEmail,
          paramType: typeof inviteeEmail,
        },
        {
          paramName: 'inviteeName',
          paramValue: inviteeName,
          paramType: typeof inviteeName,
        },
      ],
    });

    const safeInviteeEmail = escapeStringRegexp(inviteeEmail);
    const pattern = `^${safeInviteeEmail}$`;
    const inviteeEmailRegex = new RegExp(pattern, 'i');

    const inviteeUser = await User.exists({
      'accountDetails.email': {$regex: inviteeEmailRegex},
    });

    if (inviteeUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'generateInviteLink',
        functionParams: [
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
          {
            paramName: 'inviteeEmail',
            paramValue: inviteeEmail,
            paramType: typeof inviteeEmail,
          },
          {
            paramName: 'inviteeName',
            paramValue: inviteeName,
            paramType: typeof inviteeName,
          },
        ],
        additionalMessage: 'User already has an account',
        startLogId,
      });

      return {
        message: 'User already has an account',
        status: 409,
      };
    }

    const existingInvite = await PendingInvite.exists({
      inviteeEmail: {$regex: inviteeEmailRegex},
    });

    if (existingInvite) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'generateInviteLink',
        functionParams: [
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
          {
            paramName: 'inviteeEmail',
            paramValue: inviteeEmail,
            paramType: typeof inviteeEmail,
          },
          {
            paramName: 'inviteeName',
            paramValue: inviteeName,
            paramType: typeof inviteeName,
          },
        ],
        additionalMessage: 'Pending Invite already exists for this User',
        startLogId,
      });

      return {
        message: 'Pending Invite already exists for this User',
        status: 409,
      };
    }

    const couponCode = cuid.slug();
    const joinLink = `https://30mins.com/join?code=${couponCode}`;

    await PendingInvite.create({
      inviteeEmail,
      inviteeName,
      inviterUserId: decodedToken.UserId,
      couponCode,
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'generateInviteLink',
      functionParams: [
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
        {
          paramName: 'inviteeEmail',
          paramValue: inviteeEmail,
          paramType: typeof inviteeEmail,
        },
        {
          paramName: 'inviteeName',
          paramValue: inviteeName,
          paramType: typeof inviteeName,
        },
      ],
      additionalMessage: `Created Invite Successfully: ${joinLink}`,
      startLogId,
    });

    return {
      message: joinLink,
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'generateInviteLink',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'inviteeEmail',
            paramValue: inviteeEmail,
            paramType: typeof inviteeEmail,
          },
          {
            paramName: 'inviteeName',
            paramValue: inviteeName,
            paramType: typeof inviteeName,
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
      functionName: 'generateInviteLink',
      functionParams: [
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
        {
          paramName: 'inviteeEmail',
          paramValue: inviteeEmail,
          paramType: typeof inviteeEmail,
        },
        {
          paramName: 'inviteeName',
          paramValue: inviteeName,
          paramType: typeof inviteeName,
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
