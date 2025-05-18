import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ZipConversion from '../../../../MongoModels/ZipConversion';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import _ from 'lodash';

export default async function adminUpdateUser(
  parent,
  {userData, token, documentId},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'adminUpdateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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
    });

    const isAdminUser = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': 'admin',
    });

    if (!isAdminUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminUpdateUser',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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

    const existingUser = await User.findById(documentId).orFail(
      () => new Error('User Document Not Found')
    );

    // // If Username is Present Verify Non-Dupe Username
    if (userData?.accountDetails?.username) {
      const safeUsername = escapeStringRegexp(userData?.accountDetails.username);
      const pattern = `^${safeUsername}$`;
      const regex = new RegExp(pattern, 'i');

      const dupeUsername = await User.findOne(
        {'accountDetails.username': {$regex: regex}},
        '_id accountDetails.username'
      );
      if (dupeUsername && documentId !== dupeUsername._id.valueOf()) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'adminUpdateUser',
          functionParams: [
            {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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
        const zipUpdatedUser = await User.findByIdAndUpdate(decodedToken.UserId, {
          $set: {
            'locationDetails.latitude': latLngData.latitude,
            'locationDetails.longitude': latLngData.longitude,
          },
        });
      }
    }

    // eslint-disable-next-line consistent-return
    const mergeCustomizer = (objValue, srcValue) => {
      if (_.isArray(objValue)) {
        return srcValue;
      }
    };

    const mergedObject = _.merge(existingUser, userData, mergeCustomizer);

    await User.findByIdAndUpdate(
      existingUser._id,
      {$set: mergedObject},
      {strict: false, runValidators: true}
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'adminUpdateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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
        functionName: 'adminUpdateUser',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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

    if (err?._message === 'User validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminUpdateUser',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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
      functionName: 'adminUpdateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},
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
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
