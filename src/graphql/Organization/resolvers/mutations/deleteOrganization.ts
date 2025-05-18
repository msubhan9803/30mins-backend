import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import PendingJoinRequest from '../../../../MongoModels/PendingJoinRequest';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Service from '../../../../MongoModels/Service';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
import StatisticsProcessingQueue from '../../../../MongoModels/StatisticsProcessingQueue';
import dayjs from 'dayjs';

export default async function deleteOrganization(parent, {documentId, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'deleteOrganization',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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

    const hasDeletePermission = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId: documentId,
      role: 'owner',
    });

    if (!hasDeletePermission) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteOrganization',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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
        additionalMessage: 'Not Authenticated: User Lacks Delete Permission',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const deletedOrganization: any = await Organization.findOneAndDelete({_id: documentId})
      .orFail(() => new Error('Document Not Found'))
      .exec();

    // Delete all linked OrganizationMemberships
    await OrganizationMembership.deleteMany({organizationId: deletedOrganization._id}).exec();
    await PendingInvite.deleteMany({organizationId: deletedOrganization._id}).exec();
    await PendingJoinRequest.deleteMany({organizationId: deletedOrganization._id}).exec();
    await Service.deleteMany({_id: {$in: deletedOrganization?.services}});
    await RoundRobinTeam.deleteMany({organizationId: deletedOrganization._id}).exec();

    await StatisticsProcessingQueue.create({
      schemaName: 'GlobalBussiness',
      fields: {
        totalOrganizationsSignedUp: -1,
      },
      timeStamp: dayjs().toISOString(),
    });
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'deleteOrganization',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
      additionalMessage: 'Deleted Organization Successfully',
      startLogId,
    });

    return {
      message: 'Deleted Organization Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteOrganization',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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
      functionName: 'deleteOrganization',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
