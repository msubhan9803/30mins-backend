import {languageCode} from '../../../../utils/languageCode';
import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ZipConversion from '../../../../MongoModels/ZipConversion';
import escapeStringRegexp from 'escape-string-regexp';
import sendEmail from '../../../../utils/sendEmailHandler';
import EmailTemplates from '../../../../constants/emailTemplateIDs';
import fieldsToEncrypt from '../../../../constants/fieldsToEncrypt';
import encryptObject from '../../../../utils/encryption/encryptObject';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {LANGUAGES} from '../../../../constants/enums';

export default async function updateUserWelcome(parent, {userData, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const {name, username, country, zipCode, timezone, welcomeComplete} = userData;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateUserWelcome',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    if (username) {
      const safeUsername = escapeStringRegexp(username);
      const pattern = `^${safeUsername}$`;
      const regex = new RegExp(pattern, 'i');

      const dupeUsername = await User.findOne(
        {'accountDetails.username': {$regex: regex}},
        '_id accountDetails.username'
      );

      if (dupeUsername && decodedToken.UserId !== dupeUsername._id.valueOf()) {
        return {
          message: 'Username Already Exists',
          status: 409,
        };
      }
    }

    const updateData = {
      welcomeComplete,
      personalDetails: {
        name: name,
      },
      accountDetails: {
        username: username,
      },
      locationDetails: {
        zipCode: zipCode,
        country: country,
        timezone: timezone,
        latitude: undefined,
        longitude: undefined,
      },
    };

    if (zipCode && country) {
      const latLngData = await ZipConversion.findOne({
        zipCode,
        country,
      }).exec();

      if (latLngData) {
        updateData.locationDetails.latitude = latLngData.latitude;
        updateData.locationDetails.longitude = latLngData.longitude;
      }
    }

    const existingUser = await User.findById(decodedToken.UserId).orFail(
      () => new Error('User Document Not Found')
    );

    const updatedUser = await encryptObject(existingUser, updateData, fieldsToEncrypt.User);

    await User.findByIdAndUpdate(
      existingUser._id,
      {$set: updatedUser},
      {strict: false, runValidators: true}
    );

    if (welcomeComplete) {
      await sendEmail(
        {
          name: updatedUser.personalDetails.name,
          username: updatedUser.accountDetails.username,
          calendarLinked: updatedUser?.accountDetails?.credentialIDs?.length > 0,
          [languageCode(updatedUser?.accountDetails?.language || LANGUAGES.ENGLISH)]: true,
        },
        updatedUser.accountDetails.email,
        EmailTemplates.OUTREACH.WELCOME_COMPLETE,
        'signups@30mins.com'
      );
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateUserWelcome',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'User Updated Successfully',
      startLogId,
    });

    return {
      message: 'User Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateUserWelcome',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},
          {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
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

    if (err?._message === 'User validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateUserWelcome',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},
          {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
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
        status: 400,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'updateUserWelcome',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
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
