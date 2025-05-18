import Organization from '../../../../MongoModels/Organization';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

export default async function adminEditOrganization(
  parent,
  {organizationData, documentId},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'adminEditOrganization',
      functionParams: [
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
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

    const isAdminUser = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': 'admin',
    });

    if (!isAdminUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminEditOrganization',
        functionParams: [
          {
            paramName: 'adminUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
        ],
        additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    if (title) {
      const safeOrgTitle = escapeStringRegexp(title);
      const pattern = `^${safeOrgTitle}$`;
      const orgTitleRegex = new RegExp(pattern, 'i');

      const existingTitle = await Organization.exists({
        title: {$regex: orgTitleRegex},
        _id: {$ne: documentId},
      });

      if (existingTitle) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'adminEditOrganization',
          functionParams: [
            {
              paramName: 'organizationData',
              paramValue: organizationData,
              paramType: typeof organizationData,
            },
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
          additionalMessage: 'Duplicate Title',
          startLogId,
        });

        return {
          message: 'Organization Title Already In Use',
          status: 409,
        };
      }
    }

    if (slug) {
      const safeSlug = escapeStringRegexp(slug);
      const slugPattern = `^${safeSlug}$`;
      const slugRegex = new RegExp(slugPattern, 'i');

      const existingSlug = await Organization.exists({
        slug: {$regex: slugRegex},
        _id: {$ne: documentId},
      });

      if (existingSlug) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'adminEditOrganization',
          functionParams: [
            {
              paramName: 'organizationData',
              paramValue: organizationData,
              paramType: typeof organizationData,
            },
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
          additionalMessage: 'Duplicate Slug',
          startLogId,
        });

        return {
          message: 'Organization Slug Already In Use',
          status: 409,
        };
      }
    }

    const updatedOrganization = await Organization.findByIdAndUpdate(
      documentId,
      {
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
      },
      {runValidators: true}
    )
      .orFail(() => new Error('Document Not Found'))
      .exec();
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'adminEditOrganization',
      functionParams: [
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
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
      additionalMessage: 'Updated Organization Successfully',
      startLogId,
    });

    return {
      message: 'Updated Organization Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminEditOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
          },
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

    if (err?._message === 'Organization validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminEditOrganization',
        functionParams: [
          {
            paramName: 'organizationData',
            paramValue: organizationData,
            paramType: typeof organizationData,
          },
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
      functionName: 'adminEditOrganization',
      functionParams: [
        {
          paramName: 'organizationData',
          paramValue: organizationData,
          paramType: typeof organizationData,
        },
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
