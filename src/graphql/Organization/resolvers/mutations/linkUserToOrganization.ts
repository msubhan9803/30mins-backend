import escapeStringRegexp from 'escape-string-regexp';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import User from '../../../../MongoModels/User';

import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function linkUserToOrganization(
  parent,
  {organizationTitle, userEmail},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'linkUserToOrganization',
      functionParams: [
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
        },
        {
          paramName: 'userEmail',
          paramValue: 'userEmail',
          paramType: typeof userEmail,
        },
      ],
    });

    const isMarketer = await User.exists({
      _id: decodedToken.UserId,
      isMarketer: true,
    });

    if (!isMarketer) {
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
            paramName: 'organizationTitle',
            paramValue: organizationTitle,
            paramType: typeof organizationTitle,
          },
          {
            paramName: 'userEmail',
            paramValue: userEmail,
            paramType: typeof userEmail,
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

    const safeEmail = escapeStringRegexp(userEmail);
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const safeOrgTitle = escapeStringRegexp(organizationTitle);
    const titlePattern = `^${safeOrgTitle}$`;
    const orgTitleRegex = new RegExp(titlePattern, 'i');

    const user = await User.findOne({
      $or: [
        {'accountDetails.email': {$regex: emailRegex}},
        {'accountDetails.username': {$regex: emailRegex}},
      ],
    })
      .orFail(() => new Error('User Document Not Found'))
      .exec();

    const organization = await Organization.findOne({title: {$regex: orgTitleRegex}})
      .orFail(() => new Error('Organization Document Not Found'))
      .exec();

    const existingMembership = await OrganizationMembership.exists({
      userId: user._id,
      organizationId: organization._id,
    });

    if (existingMembership) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'linkUserToOrganization',
        functionParams: [
          {
            paramName: 'organizationTitle',
            paramValue: organizationTitle,
            paramType: typeof organizationTitle,
          },
          {
            paramName: 'userEmail',
            paramValue: 'userEmail',
            paramType: typeof userEmail,
          },
        ],
        additionalMessage: 'User is Already a Member of this Organization',
      });

      return {
        message: 'User is Already a Member of this Organization',
        status: 409,
      };
    }

    const createdMembership = await OrganizationMembership.create({
      userId: user._id,
      organizationId: organization._id,
      role: 'owner',
    });

    await Organization.findByIdAndUpdate(organization._id, {
      $push: {
        members: createdMembership.userId,
      },
    }).exec();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'linkUserToOrganization',
      functionParams: [
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
        },
        {
          paramName: 'userEmail',
          paramValue: 'userEmail',
          paramType: typeof userEmail,
        },
      ],
      additionalMessage: 'User Linked Successfully',
      startLogId,
    });

    return {
      message: 'User Linked Successfully',
      status: 200,
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'linkUserToOrganization',
      functionParams: [
        {
          paramName: 'organizationTitle',
          paramValue: organizationTitle,
          paramType: typeof organizationTitle,
        },
        {
          paramName: 'userEmail',
          paramValue: 'userEmail',
          paramType: typeof userEmail,
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
