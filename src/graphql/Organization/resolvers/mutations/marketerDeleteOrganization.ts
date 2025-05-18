import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import PendingJoinRequest from '../../../../MongoModels/PendingJoinRequest';

import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';

export default async function marketerDeleteOrganization(parent, {organizationTitle}, context) {
  let startLogId: String;
  let decodedToken: AccessToken;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    decodedToken = jwt.verify(context.token, accessTokenSecret) as unknown as AccessToken;
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'marketerDeleteOrganization',
      functionParams: [
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {message: 'Not Authorized', status: 401},
    };
  }

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'marketerDeleteOrganization',
      functionParams: [
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const marketingUser = await User.findOne({
      _id: decodedToken.UserId,
      isMarketer: true,
    });

    if (!marketingUser) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerDeleteOrganization',
        functionParams: [
          {
            paramName: 'organizationTitle',
            paramValue: organizationTitle,
            paramType: typeof organizationTitle,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Not Authenticated: User Lacks Marketer Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }
    const safeTitle = escapeStringRegexp(organizationTitle);
    const titlePattern = `^${safeTitle}$`;
    const titleRegex = new RegExp(titlePattern, 'i');

    const deletedOrganization = await Organization.findOneAndDelete({
      title: {$regex: titleRegex},
      $or: [{createdBy: marketingUser._id}, {affiliateTeamCreatedBy: marketingUser.affiliateTeam}],
    });

    await OrganizationMembership.deleteMany({organizationId: deletedOrganization._id});
    await PendingInvite.deleteMany({organizationId: deletedOrganization._id});
    await PendingJoinRequest.deleteMany({organizationId: deletedOrganization._id});

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'marketerDeleteOrganization',
      functionParams: [
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Organization Deleted Successfully',
      startLogId,
    });

    return {
      message: 'Organization Deleted Successfully',
      status: 200,
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'marketerDeleteOrganization',
      functionParams: [
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
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
