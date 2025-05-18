import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../constants/types';
import User from '../../../MongoModels/User';
import Credential from '../../../MongoModels/Credential';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../utils/createApiLog';
import encryptObject from '../../../utils/encryption/encryptObject';
import fieldsToEncrypt from '../../../constants/fieldsToEncrypt';
import AwsSecrets from '../../../utils/getAwsSecrets';
import encrypt from '../../../utils/encryption/encrypt';

const queries = {};

const mutations = {
  addOffice365Calendar: async (parent, {credentials, email, allowedProviders}, context, info) => {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    let startLogId: String;

    try {
      const decodedToken = jwt.verify(context.token, accessTokenSecret) as unknown as AccessToken;

      startLogId = await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.INFO,
        functionName: 'addOffice365Calendar',
        functionParams: [
          {
            paramName: 'credentials',
            paramValue: 'HIDDEN_CREDENTIALS',
            paramType: typeof credentials,
          },
          {
            paramName: 'email',
            paramValue: 'email',
            paramType: typeof email,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'allowedProviders',
            paramValue: allowedProviders,
            paramType: typeof allowedProviders,
          },
        ],
      });

      const {UserId} = decodedToken;

      const existingOfficeCalendar = await Credential.find({
        userEmail: email,
        type: 'office365calendar',
      });

      if (existingOfficeCalendar.length === 5) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'addOffice365Calendar',
          functionParams: [
            {
              paramName: 'credentials',
              paramValue: 'HIDDEN_CREDENTIALS',
              paramType: typeof credentials,
            },
            {
              paramName: 'email',
              paramValue: 'email',
              paramType: typeof email,
            },
            {
              paramName: 'userId',
              paramValue: decodedToken.UserId,
              paramType: typeof decodedToken.UserId,
            },
            {
              paramName: 'allowedProviders',
              paramValue: allowedProviders,
              paramType: typeof allowedProviders,
            },
          ],
          additionalMessage:
            'This calendar has exceeded the connection limit of 5, please remove from your other accounts and try again',
          startLogId,
        });

        return {
          message:
            'This calendar has exceeded the connection limit of 5, please remove from your other accounts and try again',
          status: 410,
        };
      }

      const dupeIntegration = await Credential.exists({
        userId: UserId,
        userEmail: email,
        type: 'office365calendar',
      });

      if (dupeIntegration) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'addOffice365Calendar',
          functionParams: [
            {
              paramName: 'credentials',
              paramValue: 'HIDDEN_CREDENTIALS',
              paramType: typeof credentials,
            },
            {
              paramName: 'email',
              paramValue: 'email',
              paramType: typeof email,
            },
            {
              paramName: 'userId',
              paramValue: decodedToken.UserId,
              paramType: typeof decodedToken.UserId,
            },
            {
              paramName: 'allowedProviders',
              paramValue: allowedProviders,
              paramType: typeof allowedProviders,
            },
          ],
          additionalMessage: 'Duplicate Integration',
          startLogId,
        });

        return {
          message: 'Duplicate Integration',
          status: 409,
        };
      }

      const payloadData = {
        userId: UserId,
        type: 'office365calendar',
        credentials,
        userEmail: email,
        allowedProviders,
        isPrimary: !existingOfficeCalendar,
      };

      const hasOfficeCalendar = await Credential.exists({
        userId: UserId,
        type: 'office365calendar',
      });

      const encryptedData = await encryptObject({}, payloadData, fieldsToEncrypt.OfficeCredential);

      const newCredential = await Credential.create(encryptedData);

      const typesToAdd = hasOfficeCalendar ? [] : allowedProviders;

      const updatedUser = await User.findByIdAndUpdate(UserId, {
        $push: {
          'accountDetails.credentialIDs': newCredential._id,
          'accountDetails.allowedConferenceTypes': typesToAdd,
        },
      }).exec();

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'addOffice365Calendar',
        functionParams: [
          {
            paramName: 'credentials',
            paramValue: 'HIDDEN_CREDENTIALS',
            paramType: typeof credentials,
          },
          {
            paramName: 'email',
            paramValue: 'email',
            paramType: typeof email,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'allowedProviders',
            paramValue: allowedProviders,
            paramType: typeof allowedProviders,
          },
        ],
        additionalMessage: 'Credentials Updated Successfully',
        startLogId,
      });

      return {
        message: 'Credentials Updated Successfully',
        status: 200,
      };
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'addOffice365Calendar',
          functionParams: [
            {
              paramName: 'credentials',
              paramValue: 'HIDDEN_CREDENTIALS',
              paramType: typeof credentials,
            },
            {
              paramName: 'email',
              paramValue: 'email',
              paramType: typeof email,
            },
            {
              paramName: 'allowedProviders',
              paramValue: allowedProviders,
              paramType: typeof allowedProviders,
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

      const decodedToken = jwt.verify(context.token, accessTokenSecret) as unknown as AccessToken;

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'addOffice365Calendar',
        functionParams: [
          {
            paramName: 'credentials',
            paramValue: 'HIDDEN_CREDENTIALS',
            paramType: typeof credentials,
          },
          {
            paramName: 'email',
            paramValue: 'email',
            paramType: typeof email,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'allowedProviders',
            paramValue: allowedProviders,
            paramType: typeof allowedProviders,
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
  },

  deleteOffice365Calendar: async (parent, {token, email}, context, info) => {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    let startLogId: String;

    try {
      const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
      const {UserId} = decodedToken;

      startLogId = await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.INFO,
        functionName: 'deleteOffice365Calendar',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'email',
            paramValue: 'email',
            paramType: typeof email,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
      });

      const deletedCredential = await Credential.findOneAndDelete({
        userId: UserId,
        type: 'office365calendar',
        userEmail: email,
      })
        .orFail(() => new Error('Document Not Found'))
        .exec();

      const newPrimary = await Credential.findOneAndUpdate(
        {
          userId: UserId,
          type: 'office365calendar',
        },
        {
          $set: {
            isPrimary: true,
          },
        }
      ).exec();

      const typesToAdd = newPrimary?.allowedProviders ? newPrimary.allowedProviders : [];

      await User.findByIdAndUpdate(UserId, {
        $pull: {
          'accountDetails.credentialIDs': deletedCredential._id,
          'accountDetails.allowedConferenceTypes': {$in: deletedCredential.allowedProviders},
        },
      }).exec();

      await User.findByIdAndUpdate(UserId, {
        $push: {
          'accountDetails.allowedConferenceTypes': typesToAdd,
        },
      }).exec();

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'deleteOffice365Calendar',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'email',
            paramValue: 'email',
            paramType: typeof email,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Credentials Deleted Successfully',
        startLogId,
      });

      return {
        message: 'Credentials Deleted Successfully',
        status: 200,
      };
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'deleteOffice365Calendar',
          functionParams: [
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
            {
              paramName: 'email',
              paramValue: 'email',
              paramType: typeof email,
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

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteOffice365Calendar',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'email',
            paramValue: 'email',
            paramType: typeof email,
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
  },
  updateOfficeRefreshToken: async (parent, {refreshToken, credentialId}, context) => {
    let startLogId: String;

    try {
      const ENV_VALUES = await AwsSecrets.getInstance();
      if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'updateOfficeRefreshToken',
          functionParams: [
            {
              paramName: 'refreshToken',
              paramValue: refreshToken,
              paramType: typeof refreshToken,
            },
            {
              paramName: 'credentialId',
              paramValue: credentialId,
              paramType: typeof credentialId,
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
        functionName: 'updateOfficeRefreshToken',
        functionParams: [
          {
            paramName: 'refreshToken',
            paramValue: refreshToken,
            paramType: typeof refreshToken,
          },
          {
            paramName: 'credentialId',
            paramValue: credentialId,
            paramType: typeof credentialId,
          },
        ],
      });

      const encryptedRefreshToken = await encrypt(refreshToken, ENV_VALUES.ENCRYPTION_SECRET);

      await Credential.findByIdAndUpdate(credentialId, {
        $set: {
          'credentials.refresh_token': encryptedRefreshToken,
        },
      });

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'updateOfficeRefreshToken',
        functionParams: [
          {
            paramName: 'refreshToken',
            paramValue: refreshToken,
            paramType: typeof refreshToken,
          },
          {
            paramName: 'credentialId',
            paramValue: credentialId,
            paramType: typeof credentialId,
          },
        ],
        additionalMessage: 'Credentials Updated Successfully',
        startLogId,
      });

      return {
        message: 'Credentials Updated Successfully',
        status: 200,
      };
    } catch (err) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateOfficeRefreshToken',
        functionParams: [
          {
            paramName: 'refreshToken',
            paramValue: refreshToken,
            paramType: typeof refreshToken,
          },
          {
            paramName: 'credentialId',
            paramValue: credentialId,
            paramType: typeof credentialId,
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
  },
};

export const resolvers = {queries, mutations};
