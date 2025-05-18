import {languageCode} from './../../../../utils/languageCode';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {LANGUAGES} from '../../../../constants/enums';

export default async function kickOrganizationMember(
  parent,
  {token, organizationMembershipId, organizationId, kickReason},
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
      functionName: 'kickOrganizationMember',
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

    const hasKickPermission = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId: organizationId,
      role: {$in: ['owner', 'admin']},
    });

    if (!hasKickPermission) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'kickOrganizationMember',
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
        additionalMessage: 'Not Authenticated: User Lacks Kick Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const deletedMembership = await OrganizationMembership.findOneAndDelete({
      _id: organizationMembershipId,
      organizationId,
    })
      .orFail(() => new Error('Organization Membership Document Not Found'))
      .exec();

    const updatedOrganization = await Organization.findByIdAndUpdate(organizationId, {
      $pull: {
        members: deletedMembership.userId,
      },
    })
      .orFail(() => new Error('Organization Document Not Found'))
      .exec();

    const deletedServices = await Service.deleteMany({
      _id: deletedMembership.userId,
      organizationId,
    }).exec();

    const currentOrganization = await Organization.findById({
      _id: organizationId,
    })
      .orFail(() => new Error('Organization Document Not Found'))
      .exec();

    const kickedMember = await User.findById({
      _id: deletedMembership?.userId,
    })
      .orFail(() => new Error('User Document Not Found'))
      .exec();

    await sendEmail(
      {
        orgName: currentOrganization?.title,
        memberName: kickedMember?.personalDetails?.name,
        kickReason,
        [languageCode(kickedMember?.personalDetails?.language || LANGUAGES.ENGLISH)]: true,
      },
      kickedMember?.accountDetails?.email,
      TEMPLATES.OUTREACH.KICK_ORG_MEMBER
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'kickOrganizationMember',
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
      additionalMessage: 'Organization Member Removed Successfully',
      startLogId,
    });

    return {
      message: 'Organization Member Removed Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'kickOrganizationMember',
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

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'kickOrganizationMember',
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
