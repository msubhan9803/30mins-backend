import {LANGUAGES} from '../../../../constants/enums';
import {languageCode} from '../../../../utils/languageCode';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import PendingJoinRequest from '../../../../MongoModels/PendingJoinRequest';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function createPendingJoinRequest(parent, {token, organizationId}) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String = '';
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createPendingJoinRequest',
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
          paramName: 'requesterUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const existingRequest = await PendingJoinRequest.exists({
      requesterUserId: decodedToken.UserId,
      organizationId,
    });

    if (existingRequest) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createPendingJoinRequest',
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
            paramName: 'requesterUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Pending Request already exists for this User',
        startLogId,
      });

      return {
        message: 'Pending Request already exists for this User',
        status: 409,
      };
    }

    const requesterUser = await User.findById(decodedToken.UserId)
      .orFail(() => new Error('User Document Not Found'))
      .exec();

    const organization = await Organization.findById(organizationId)
      .orFail(() => new Error('Organization Document Not Found'))
      .exec();

    const userInOrg = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId,
    });

    if (userInOrg) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createPendingJoinRequest',
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

    const orgOwnerMembership = await OrganizationMembership.findOne({
      organizationId,
      role: 'owner',
    })
      .populate('userId', [
        'accountDetails.email',
        'personalDetails.name',
        'personalDetails.language',
      ])
      .orFail(() => new Error('Organization Owner Document Not Found'))
      .exec();

    const orgOwnerUser = orgOwnerMembership.userId;

    const createdRequest = await PendingJoinRequest.create({
      requesterUserId: requesterUser._id,
      organizationId,
    });

    await sendEmail(
      {
        organizationTitle: organization.title,
        ownerName: orgOwnerUser.personalDetails.name,
        organizationID: organizationId,
        requesterName: requesterUser.personalDetails.name,
        requesterUsername: requesterUser.accountDetails.username,
        requestID: createdRequest?._id,
        [languageCode(orgOwnerUser?.personalDetails?.language || LANGUAGES.ENGLISH)]: true,
      },
      orgOwnerUser.accountDetails.email,
      TEMPLATES.ORGANIZATIONS.REQUEST_TO_OWNER
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createPendingJoinRequest',
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
          paramName: 'requesterUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Created Request Successfully',
      startLogId,
    });

    return {
      message: 'Created Request Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createPendingJoinRequest',
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

    if (err?._message === 'PendingJoinRequest validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createPendingJoinRequest',
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
            paramName: 'requesterUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Mongoose PendingJoinRequest Validation Failed',
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
      functionName: 'createPendingJoinRequest',
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
          paramName: 'requesterUserId',
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
