import {LANGUAGES} from '../../../../constants/enums';
import {languageCode} from '../../../../utils/languageCode';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import PendingJoinRequest from '../../../../MongoModels/PendingJoinRequest';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {PROFILE_LINK} from '../../../../constants/variables';

export default async function acceptPendingJoinRequest(
  parent,
  {token, pendingRequestId},
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
      functionName: 'acceptPendingJoinRequest',
      functionParams: [
        {
          paramName: 'pendingRequestId',
          paramValue: pendingRequestId,
          paramType: typeof pendingRequestId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'accepterUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const existingRequest = await PendingJoinRequest.findById(pendingRequestId)
      .populate('requesterUserId', [
        '_id',
        'accountDetails.email',
        'accountDetails.username',
        'personalDetails.name',
        'personalDetails.language',
      ])
      .populate('organizationId', ['_id', 'title']);

    if (!existingRequest) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'acceptPendingJoinRequest',
        functionParams: [
          {
            paramName: 'pendingRequestId',
            paramValue: pendingRequestId,
            paramType: typeof pendingRequestId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'accepterUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'No Pending Request exists for this User',
        startLogId,
      });

      return {
        message: 'No Pending Request exists for this User',
        status: 404,
      };
    }

    const accepterUserId = decodedToken.UserId;
    const requesterUserId = existingRequest.requesterUserId._id;
    const organizationId = existingRequest.organizationId._id;

    const userInOrg = await OrganizationMembership.exists({
      userId: requesterUserId,
      organizationId,
    });

    if (userInOrg) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'acceptPendingJoinRequest',
        functionParams: [
          {
            paramName: 'pendingRequestId',
            paramValue: pendingRequestId,
            paramType: typeof pendingRequestId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'accepterUserId',
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

    const hasPermissions = await OrganizationMembership.exists({
      userId: accepterUserId,
      organizationId,
      role: {$in: ['admin', 'owner']},
    });

    if (!hasPermissions) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'acceptPendingJoinRequest',
        functionParams: [
          {
            paramName: 'pendingRequestId',
            paramValue: pendingRequestId,
            paramType: typeof pendingRequestId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'accepterUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
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

    const createdMember = await OrganizationMembership.create({
      userId: requesterUserId,
      organizationId,
      role: 'member',
    });

    await Organization.findByIdAndUpdate(organizationId, {
      $push: {
        members: createdMember.userId,
      },
    })
      .orFail(() => new Error('Organization Document Not Found'))
      .exec();

    await PendingJoinRequest.findByIdAndDelete(pendingRequestId);

    await sendEmail(
      {
        requesterName: existingRequest.requesterUserId.personalDetails.name,
        organizationTitle: existingRequest.organizationId.title,
        requesterEmail: existingRequest.requesterUserId.accountDetails.email,
        requesterProfileLink:
          PROFILE_LINK + existingRequest.requesterUserId.accountDetails.username,
        requestStatus: 'Accepted',
        [languageCode(
          existingRequest.requesterUserId?.personalDetails?.language || LANGUAGES.ENGLISH
        )]: true,
      },
      existingRequest.requesterUserId.accountDetails.email,
      TEMPLATES.ORGANIZATIONS.REQUEST_STATUS
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'acceptPendingJoinRequest',
      functionParams: [
        {
          paramName: 'organizationId',
          paramValue: organizationId,
          paramType: typeof organizationId,
        },
        {
          paramName: 'pendingRequestId',
          paramValue: pendingRequestId,
          paramType: typeof pendingRequestId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'accepterUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Accepted Request Successfully',
      startLogId,
    });

    return {
      message: 'Accepted Request Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'acceptPendingJoinRequest',
        functionParams: [
          {
            paramName: 'pendingRequestId',
            paramValue: pendingRequestId,
            paramType: typeof pendingRequestId,
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
      functionName: 'acceptPendingJoinRequest',
      functionParams: [
        {
          paramName: 'pendingRequestId',
          paramValue: pendingRequestId,
          paramType: typeof pendingRequestId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'accepterUserId',
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
