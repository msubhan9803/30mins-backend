import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

import User from '../../../../MongoModels/User';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import cuid from 'cuid';
import escapeStringRegexp from 'escape-string-regexp';

export default async function marketerCreateUser(parent, {userData}, context) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'marketerCreateUser',
      functionParams: [
        {
          paramName: 'marketerId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'userData',
          paramValue: userData,
          paramType: typeof userData,
        },
      ],
    });

    const marketingUser = await User.findOne({
      _id: decodedToken.UserId,
      isMarketer: true,
    });

    if (!marketingUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerCreateUser',
        functionParams: [
          {
            paramName: 'marketerId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'userData',
            paramValue: userData,
            paramType: typeof userData,
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

    const safeUsername = escapeStringRegexp(userData.accountDetails.username);
    const pattern = `^${safeUsername}$`;
    const regex = new RegExp(pattern, 'i');

    const dupeUsername = await User.findOne(
      {'accountDetails.username': {$regex: regex}},
      '_id accountDetails.username'
    );
    if (dupeUsername) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerCreateUser',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},
          {
            paramName: 'marketerId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Username Already Exists',
        startLogId,
      });

      return {
        message: 'Username Already Exists',
        status: 409,
      };
    }

    const safeEmail = escapeStringRegexp(userData.accountDetails.email);
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const dupeEmail = await User.findOne(
      {'accountDetails.email': {$regex: emailRegex}},
      '_id accountDetails.email'
    );
    if (dupeEmail) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerCreateUser',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},
          {
            paramName: 'marketerId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Email Already Exists',
        startLogId,
      });

      return {
        message: 'Email Already Exists',
        status: 409,
      };
    }

    await User.create({
      'personalDetails.name': userData?.personalDetails?.name,
      'personalDetails.headline': userData?.personalDetails?.headline,
      'personalDetails.description': userData?.personalDetails?.description,
      'accountDetails.avatar': userData?.accountDetails?.avatar,
      'accountDetails.email': userData?.accountDetails?.email,
      'accountDetails.username': userData?.accountDetails?.username,
      'locationDetails.country': userData?.locationDetails?.country,
      'locationDetails.zipCode': userData?.locationDetails?.zipCode,
      'personalDetails.socials.linkedin': userData?.personalDetails?.socials?.linkedin,
      'personalDetails.socials.twitter': userData?.personalDetails?.socials?.twitter,
      'personalDetails.socials.instagram': userData?.personalDetails?.socials?.instagram,
      'personalDetails.socials.facebook': userData?.personalDetails?.socials?.facebook,
      'personalDetails.socials.youtube': userData?.personalDetails?.socials?.youtube,
      'locationDetails.timezone': userData?.locationDetails?.timezone,
      createdBy: decodedToken.UserId,
      affiliateTeamCreatedBy: marketingUser?.affiliateTeam || '',
      couponCode: cuid.slug(),
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'marketerCreateUser',
      functionParams: [
        {
          paramName: 'marketerId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'userData',
          paramValue: userData,
          paramType: typeof userData,
        },
      ],
      additionalMessage: 'User Created Successfully',
      startLogId,
    });

    return {
      message: 'User Created Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerCreateUser',
        functionParams: [
          {
            paramName: 'userData',
            paramValue: userData,
            paramType: typeof userData,
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
      functionName: 'marketerCreateUser',
      functionParams: [
        {
          paramName: 'userData',
          paramValue: userData,
          paramType: typeof userData,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    console.log(err);

    return {
      message: err.message,
      status: 500,
    };
  }
}
