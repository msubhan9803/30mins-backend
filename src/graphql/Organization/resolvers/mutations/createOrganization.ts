import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import StatisticsProcessingQueue from '../../../../MongoModels/StatisticsProcessingQueue';
import dayjs from 'dayjs';

export default async function createOrganization(parent, {organizationData, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createOrganization',
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
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const hasExtension = await ActiveExtension.exists({
      userId: decodedToken.UserId,
      extensionProductId: {
        $in: [
          stripeProductIDs.EXTENSIONS.ORGANIZATIONS,
          stripeProductIDs.EXTENSIONS.ORGANIZATIONS_ANNUAL,
        ],
      },
      status: {
        $in: ['paid', 'gifted'],
      },
    });

    if (!hasExtension) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrganization',
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
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'User does not have the Organization Extension',
        startLogId,
      });

      return {
        message: 'User does not have the Organization Extension',
        status: 400,
      };
    }

    const {
      restrictionLevel,
      title,
      slug,
      headline,
      description,
      image,
      website,
      supportEmail,
      supportPhone,
      location,
      socials,
      verified,
      searchTags,
      media,
      isPrivate,
      publicFeatures,
    } = organizationData;

    const safeOrgTitle = escapeStringRegexp(title);
    const pattern = `^${safeOrgTitle}$`;
    const orgTitleRegex = new RegExp(pattern, 'i');

    const existingTitle = await Organization.exists({title: {$regex: orgTitleRegex}});

    if (existingTitle) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrganization',
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
            paramName: 'userId',
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

    const safeSlug = escapeStringRegexp(slug);
    const slugPattern = `^${safeSlug}$`;
    const slugRegex = new RegExp(slugPattern, 'i');

    const existingSlug = await Organization.exists({slug: {$regex: slugRegex}});

    if (existingSlug) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrganization',
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
            paramName: 'userId',
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

    const createdOrganization = await Organization.create({
      restrictionLevel,
      title,
      slug,
      headline,
      description,
      image,
      website,
      supportEmail,
      supportPhone,
      location,
      serviceCategories: ['default'],
      'socials.twitter': socials?.twitter,
      'socials.instagram': socials?.instagram,
      'socials.linkedin': socials?.linkedin,
      'socials.facebook': socials?.facebook,
      'socials.youtube': socials?.youtube,
      verified,
      searchTags,
      'media.type': media?.type,
      'media.link': media?.link,
      isPrivate,
      publicFeatures,
    });

    const organizationId = createdOrganization._id.valueOf();

    const ownerMembership = await OrganizationMembership.create({
      userId: decodedToken.UserId,
      organizationId: organizationId,
      role: 'owner',
    });

    createdOrganization.members = [ownerMembership.userId];
    await createdOrganization.save();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createOrganization',
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
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Created Organization Successfully',
      startLogId,
    });

    await StatisticsProcessingQueue.create({
      schemaName: 'GlobalBussiness',
      fields: {
        totalOrganizationsSignedUp: 1,
      },
      timeStamp: dayjs().toISOString(),
    });

    return {
      message: 'Created Organization Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrganization',
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

    if (err?._message === 'Organization validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createOrganization',
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
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Mongoose Organization Validation Failed',
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
      functionName: 'createOrganization',
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
