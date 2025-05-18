import {languageCode} from './../../../../utils/languageCode';
import escapeStringRegexp from 'escape-string-regexp';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import cuid from 'cuid';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {LANGUAGES} from '../../../../constants/enums';

export default async function createPendingInvite(
  parent,
  {token, inviteeEmail, organizationId, organizationTitle, language},
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
      functionName: 'createPendingInvite',
      functionParams: [
        {
          paramName: 'organizationId',
          paramValue: organizationId,
          paramType: typeof organizationId,
        },
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
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
        {
          paramName: 'inviteeEmail',
          paramValue: inviteeEmail,
          paramType: typeof inviteeEmail,
        },
      ],
    });

    const inviterUser = await OrganizationMembership.findOne({
      userId: decodedToken.UserId,
      organizationId,
      role: {$in: ['admin', 'owner']},
    })
      .populate('userId', ['personalDetails.name', 'personalDetails.language'])
      .exec();

    if (!inviterUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createPendingInvite',
        functionParams: [
          {
            paramName: 'organizationId',
            paramValue: organizationId,
            paramType: typeof organizationId,
          },
          {
            paramName: 'organizationTitle',
            paramValue: organizationTitle,
            paramType: typeof organizationTitle,
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
          {
            paramName: 'inviteeEmail',
            paramValue: inviteeEmail,
            paramType: typeof inviteeEmail,
          },
        ],
        additionalMessage: 'Invalid Permissions: User Lacks Admin/Owner Permissions',
        startLogId,
      });

      return {
        message: 'Invalid Permissions: User Lacks Admin/Owner Permissions',
        status: 401,
      };
    }

    const safeInviteeEmail = escapeStringRegexp(inviteeEmail);
    const pattern = `^${safeInviteeEmail}$`;
    const inviteeEmailRegex = new RegExp(pattern, 'i');

    const inviteeUser = await User.findOne({
      'accountDetails.email': {$regex: inviteeEmailRegex},
    }).exec();

    let userInOrg: boolean = false;

    if (inviteeUser) {
      userInOrg = await OrganizationMembership.exists({
        userId: inviteeUser._id,
        organizationId,
      });
    }

    if (userInOrg) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createPendingInvite',
        functionParams: [
          {
            paramName: 'organizationId',
            paramValue: organizationId,
            paramType: typeof organizationId,
          },
          {
            paramName: 'organizationTitle',
            paramValue: organizationTitle,
            paramType: typeof organizationTitle,
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
          {
            paramName: 'inviteeEmail',
            paramValue: inviteeEmail,
            paramType: typeof inviteeEmail,
          },
        ],
        additionalMessage: 'User already in Organization',
        startLogId,
      });

      return {
        message: 'User already in Organization',
        status: 409,
      };
    }

    const existingInvite = await PendingInvite.exists({
      inviteeEmail: {$regex: inviteeEmailRegex},
      organizationId,
    });

    if (existingInvite) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createPendingInvite',
        functionParams: [
          {
            paramName: 'organizationId',
            paramValue: organizationId,
            paramType: typeof organizationId,
          },
          {
            paramName: 'organizationTitle',
            paramValue: organizationTitle,
            paramType: typeof organizationTitle,
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
          {
            paramName: 'inviteeEmail',
            paramValue: inviteeEmail,
            paramType: typeof inviteeEmail,
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

    // Existing Invitee User Account
    if (inviteeUser) {
      await PendingInvite.create({
        inviteeUserId: inviteeUser._id.valueOf(),
        inviteeEmail: inviteeUser.accountDetails.email,
        organizationId,
        inviterUserId: decodedToken.UserId,
      });

      await sendEmail(
        {
          organizationTitle,
          inviteeName: inviteeUser.personalDetails.name,
          inviterName: inviterUser.userId.personalDetails.name,
          inviteeHasAccount: true,
          [languageCode(inviteeUser?.personalDetails?.language || LANGUAGES.ENGLISH)]: true,
        },
        inviteeEmail,
        TEMPLATES.ORGANIZATIONS.INVITE_TO_INVITEE
      );
    }

    // Non-Existing Invitee User Account
    if (!inviteeUser) {
      const couponCode = cuid.slug();
      const joinLink = `https://30mins.com/join?code=${couponCode}`;

      await PendingInvite.create({
        inviteeEmail,
        organizationId,
        inviterUserId: decodedToken.UserId,
        couponCode,
      });

      await sendEmail(
        {
          organizationTitle,
          inviterName: inviterUser.userId.personalDetails.name,
          inviteeHasAccount: false,
          joinLink,
          [languageCode(language)]: true,
        },
        inviteeEmail,
        TEMPLATES.ORGANIZATIONS.INVITE_TO_INVITEE
      );
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createPendingInvite',
      functionParams: [
        {
          paramName: 'organizationId',
          paramValue: organizationId,
          paramType: typeof organizationId,
        },
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
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
        {
          paramName: 'inviteeEmail',
          paramValue: inviteeEmail,
          paramType: typeof inviteeEmail,
        },
      ],
      additionalMessage: 'Created Invite Successfully',
      startLogId,
    });

    return {
      message: 'Created Invite Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createPendingInvite',
        functionParams: [
          {
            paramName: 'organizationId',
            paramValue: organizationId,
            paramType: typeof organizationId,
          },
          {
            paramName: 'organizationTitle',
            paramValue: organizationTitle,
            paramType: typeof organizationTitle,
          },
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
      functionName: 'createPendingInvite',
      functionParams: [
        {
          paramName: 'organizationId',
          paramValue: organizationId,
          paramType: typeof organizationId,
        },
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
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
        {
          paramName: 'inviteeEmail',
          paramValue: inviteeEmail,
          paramType: typeof inviteeEmail,
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
