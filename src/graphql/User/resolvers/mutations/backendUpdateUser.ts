import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ZipConversion from '../../../../MongoModels/ZipConversion';
import escapeStringRegexp from 'escape-string-regexp';
import fieldsToEncrypt from '../../../../constants/fieldsToEncrypt';
import encryptObject from '../../../../utils/encryption/encryptObject';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function backendUpdateUser(parent, {userData, email}, context, info) {
  let startLogId: String;

  try {
    const SECRETS = await AwsSecrets.getInstance();
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'backendUpdateUser',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},

          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'backendUpdateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},

        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
        },
      ],
    });

    const safeEmail = escapeStringRegexp(email.trim());
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const existingUser = await User.findOne({'accountDetails.email': {$regex: emailRegex}}).orFail(
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
      if (dupeUsername && existingUser._id.valueOf() !== dupeUsername._id.valueOf()) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'backendUpdateUser',
          functionParams: [
            {paramName: 'userData', paramValue: userData, paramType: typeof userData},

            {
              paramName: 'email',
              paramValue: email,
              paramType: typeof email,
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
        const zipUpdatedUser = await User.findByIdAndUpdate(existingUser._id, {
          $set: {
            'locationDetails.latitude': latLngData.latitude,
            'locationDetails.longitude': latLngData.longitude,
          },
        });
      }
    }

    const updatedUser = await encryptObject(existingUser, userData, fieldsToEncrypt.User);

    await User.findByIdAndUpdate(
      existingUser._id,
      {$set: updatedUser},
      {strict: false, runValidators: true}
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'backendUpdateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},

        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
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
    if (err?._message === 'User validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'backendUpdateUser',
        functionParams: [
          {paramName: 'userData', paramValue: userData, paramType: typeof userData},

          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
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
      functionName: 'backendUpdateUser',
      functionParams: [
        {paramName: 'userData', paramValue: userData, paramType: typeof userData},

        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
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
