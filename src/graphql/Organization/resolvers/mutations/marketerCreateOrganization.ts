import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

import User from '../../../../MongoModels/User';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Organization from '../../../../MongoModels/Organization';
import escapeStringRegexp from 'escape-string-regexp';

export default async function marketerCreateOrganization(parent, {organizationData}, context) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'marketerCreateOrganization',
      functionParams: [
        {
          paramName: 'marketerId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
      ],
    });

    const marketerUser = await User.findOne({
      _id: decodedToken.UserId,
      isMarketer: true,
    });

    if (!marketerUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerCreateOrganization',
        functionParams: [
          {
            paramName: 'marketerId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
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

    const safeOrgTitle = escapeStringRegexp(organizationData.title);
    const pattern = `^${safeOrgTitle}$`;
    const orgTitleRegex = new RegExp(pattern, 'i');

    const existingTitle = await Organization.exists({
      title: {$regex: orgTitleRegex},
    });

    if (existingTitle) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerCreateOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'marketerId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Duplicate Title',
        startLogId,
      });

      return {
        message: 'Organization Title Already In Use',
        status: 409,
      };
    }

    const safeSlug = escapeStringRegexp(organizationData.slug);
    const slugPattern = `^${safeSlug}$`;
    const slugRegex = new RegExp(slugPattern, 'i');

    const existingSlug = await Organization.exists({
      slug: {$regex: slugRegex},
    });

    if (existingSlug) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerCreateOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
          },

          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'marketerId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Duplicate Slug',
        startLogId,
      });

      return {
        message: 'Organization Slug Already In Use',
        status: 409,
      };
    }

    await Organization.create({
      title: organizationData.title,
      slug: organizationData.slug,
      image: organizationData.image,
      website: organizationData.website,
      localtion: organizationData.localtion,
      headline: organizationData.headline,
      description: organizationData.description,
      createdBy: decodedToken.UserId,
      affiliateTeamCreatedBy: marketerUser?.affiliateTeam || '',
      restrictionLevel: 'OPEN',
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'marketerCreateOrganization',
      functionParams: [
        {
          paramName: 'marketerId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
      ],
      additionalMessage: 'Organization Created Successfully',
      startLogId,
    });

    return {
      message: 'Organization Created Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerCreateOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
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

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'marketerCreateOrganization',
      functionParams: [
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
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
