import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

export default async function adminCreateOrganization(
  parent,
  {organizationData, ownerEmail},
  context,
  info
) {
  let startLogId: String;
  let decodedToken: AccessToken;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    decodedToken = jwt.verify(context.token, accessTokenSecret) as unknown as AccessToken;
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'adminCreateOrganization',
      functionParams: [
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
        {
          paramName: 'ownerEmail',
          paramValue: ownerEmail,
          paramType: typeof ownerEmail,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
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
      functionName: 'adminCreateOrganization',
      functionParams: [
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
        {
          paramName: 'ownerEmail',
          paramValue: ownerEmail,
          paramType: typeof ownerEmail,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const isAdmin = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': 'admin',
    });

    if (!isAdmin) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminCreateOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
          },
          {
            paramName: 'ownerEmail',
            paramValue: ownerEmail,
            paramType: typeof ownerEmail,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
        startLogId,
      });

      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    const safeEmail = escapeStringRegexp(ownerEmail);
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const ownerUser = await User.findOne({'accountDetails.email': {$regex: emailRegex}}).orFail(
      () => new Error('User Document Not Found')
    );

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
    } = organizationData;

    const safeOrgTitle = escapeStringRegexp(title);
    const pattern = `^${safeOrgTitle}$`;
    const orgTitleRegex = new RegExp(pattern, 'i');

    const existingTitle = await Organization.exists({title: {$regex: orgTitleRegex}});

    if (existingTitle) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminCreateOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
          },
          {
            paramName: 'ownerEmail',
            paramValue: ownerEmail,
            paramType: typeof ownerEmail,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
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
        functionName: 'adminCreateOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
          },
          {
            paramName: 'ownerEmail',
            paramValue: ownerEmail,
            paramType: typeof ownerEmail,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
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
    });

    const organizationId = createdOrganization._id.valueOf();

    const ownerMembership = await OrganizationMembership.create({
      userId: ownerUser._id,
      organizationId: organizationId,
      role: 'owner',
    });

    createdOrganization.members = [ownerMembership.userId];
    await createdOrganization.save();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'adminCreateOrganization',
      functionParams: [
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
        {
          paramName: 'ownerEmail',
          paramValue: ownerEmail,
          paramType: typeof ownerEmail,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
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

    return {
      message: 'Created Organization Successfully',
      status: 200,
    };
  } catch (err) {
    if (err?._message === 'Organization validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminCreateOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
          },
          {
            paramName: 'ownerEmail',
            paramValue: ownerEmail,
            paramType: typeof ownerEmail,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
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
      functionName: 'adminCreateOrganization',
      functionParams: [
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
        {
          paramName: 'ownerEmail',
          paramValue: ownerEmail,
          paramType: typeof ownerEmail,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
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
