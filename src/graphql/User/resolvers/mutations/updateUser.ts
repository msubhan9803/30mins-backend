import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ZipConversion from '../../../../MongoModels/ZipConversion';
import escapeStringRegexp from 'escape-string-regexp';
import encryptObject from '../../../../utils/encryption/encryptObject';
import fieldsToEncrypt from '../../../../constants/fieldsToEncrypt';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function updateUser(parent, {userData, token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String = '';

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const data = userData;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const existingUser = await User.findById(decodedToken.UserId).orFail(
      () => new Error('User Document Not Found')
    );

    // // If Username is Present Verify Non-Dupe Username
    if (data?.accountDetails?.username) {
      const safeUsername = escapeStringRegexp(userData?.accountDetails.username);
      const pattern = `^${safeUsername}$`;
      const regex = new RegExp(pattern, 'i');

      const dupeUsername = await User.findOne(
        {'accountDetails.username': {$regex: regex}},
        '_id accountDetails.username'
      );

      if (dupeUsername && decodedToken.UserId !== dupeUsername._id.valueOf()) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'updateUser',
          functionParams: [
            {paramName: 'userData', paramValue: userData, paramType: typeof userData},
            {
              paramName: 'userId',
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
    }

    if (userData?.locationDetails?.zipCode) {
      const {country} = existingUser.locationDetails;
      const latLngData = await ZipConversion.findOne({
        zipCode: userData.locationDetails.zipCode,
        country,
      }).exec();

      if (latLngData) {
        await User.findByIdAndUpdate(decodedToken.UserId, {
          $set: {
            'locationDetails.latitude': latLngData.latitude,
            'locationDetails.longitude': latLngData.longitude,
          },
        });
      }
    }

    const updatedUser = await encryptObject(existingUser, userData, fieldsToEncrypt.User);

    if (userData?.personalDetails?.searchTags) {
      updatedUser.personalDetails.searchTags = userData?.personalDetails?.searchTags;
    }

    if (userData?.personalDetails?.searchTags) {
      updatedUser.personalDetails.searchTags = userData?.personalDetails?.searchTags;
    }

    await User.findByIdAndUpdate(
      existingUser._id,
      {$set: updatedUser},
      {strict: false, runValidators: true}
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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
        functionName: 'updateUser',
        functionParams: [{paramName: 'userData', paramValue: userData, paramType: typeof userData}],
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
        functionName: 'updateUser',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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
      functionName: 'updateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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
