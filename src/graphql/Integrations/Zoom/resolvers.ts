import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../constants/types';
import User from '../../../MongoModels/User';
import Credential from '../../../MongoModels/Credential';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../utils/createApiLog';
import ActiveExtension from '../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../constants/stripeProductIDs';
import encryptObject from '../../../utils/encryption/encryptObject';
import fieldsToEncrypt from '../../../constants/fieldsToEncrypt';
import AwsSecrets from '../../../utils/getAwsSecrets';
import encrypt from '../../../utils/encryption/encrypt';

const queries = {};

const mutations = {
  addZoomCredentials: async (
    parent,
    {credentials, email, allowedProviders, credentialIdentifier},
    context,
    info
  ) => {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    let startLogId: String;

    try {
      const decodedToken = jwt.verify(context.token, accessTokenSecret) as unknown as AccessToken;

      startLogId = await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.INFO,
        functionName: 'addZoomCredentials',
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

      const hasExtension = await ActiveExtension.exists({
        userId: decodedToken.UserId,
        extensionProductId: stripeProductIDs.EXTENSIONS.ZOOM,
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
          additionalMessage: 'User does not have the Zoom Extension',
          startLogId,
        });

        return {
          message: 'User does not have the Zoom Extension',
          status: 400,
        };
      }

      const dupeIntegration = await Credential.exists({
        userId: UserId,
        userEmail: email,
        type: 'zoom',
      });

      if (dupeIntegration) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'addZoomCredentials',
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
        type: 'zoom',
        credentialIdentifier,
        credentials,
        userEmail: email,
        allowedProviders,
        isPrimary: true,
      };

      const encryptedData = await encryptObject({}, payloadData, fieldsToEncrypt.ZoomCredential);

      const zoomCredential = await Credential.create(encryptedData);

      const updatedUser = await User.findByIdAndUpdate(UserId, {
        $push: {
          'accountDetails.credentialIDs': zoomCredential._id,
          'accountDetails.allowedConferenceTypes': ['zoom'],
        },
      }).exec();

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'addZoomCredentials',
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
          functionName: 'addZoomCredentials',
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
        functionName: 'addZoomCredentials',
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

  deleteZoomCredentials: async (parent, {token, email}, context, info) => {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    let startLogId: String;

    try {
      const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
      const {UserId} = decodedToken;

      startLogId = await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.INFO,
        functionName: 'deleteZoomCredentials',
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
        type: 'zoom',
        userEmail: email,
      })
        .orFail(() => new Error('Document Not Found'))
        .exec();

      await User.findByIdAndUpdate(UserId, {
        $pull: {
          'accountDetails.credentialIDs': deletedCredential._id,
          'accountDetails.allowedConferenceTypes': {$in: deletedCredential.allowedProviders},
        },
      }).exec();

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'deleteZoomCredentials',
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
          functionName: 'deleteZoomCredentials',
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
        functionName: 'deleteZoomCredentials',
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

  deleteZoomCredentialsWebhook: async (parent, {credentialIdentifier}, context, info) => {
    let startLogId: String;

    try {
      const ENV_VALUES = await AwsSecrets.getInstance();
      if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'deleteZoomCredentialsWebhookWebhook',
          functionParams: [
            {
              paramName: 'credentialIdentifier',
              paramValue: credentialIdentifier,
              paramType: typeof credentialIdentifier,
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
        functionName: 'deleteZoomCredentialsWebhook',
        functionParams: [
          {
            paramName: 'credentialIdentifier',
            paramValue: credentialIdentifier,
            paramType: typeof credentialIdentifier,
          },
        ],
      });

      const deletedCredential = await Credential.findOneAndDelete({
        credentialIdentifier,
        type: 'zoom',
      })
        .orFail(() => new Error('Document Not Found'))
        .exec();

      await User.findByIdAndUpdate(deletedCredential.userId, {
        $pull: {
          'accountDetails.credentialIDs': deletedCredential._id,
          'accountDetails.allowedConferenceTypes': {$in: deletedCredential.allowedProviders},
        },
      }).exec();

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'deleteZoomCredentialsWebhook',
        functionParams: [
          {
            paramName: 'credentialIdentifier',
            paramValue: credentialIdentifier,
            paramType: typeof credentialIdentifier,
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
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteZoomCredentialsWebhook',
        functionParams: [
          {
            paramName: 'credentialIdentifier',
            paramValue: credentialIdentifier,
            paramType: typeof credentialIdentifier,
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

  updateZoomRefreshToken: async (parent, {refreshToken, userId}, context) => {
    let startLogId: String;

    try {
      const ENV_VALUES = await AwsSecrets.getInstance();
      if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'updateZoomRefreshToken',
          functionParams: [
            {
              paramName: 'refreshToken',
              paramValue: refreshToken,
              paramType: typeof refreshToken,
            },
            {
              paramName: 'userId',
              paramValue: userId,
              paramType: typeof userId,
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
        functionName: 'updateZoomRefreshToken',
        functionParams: [
          {
            paramName: 'refreshToken',
            paramValue: refreshToken,
            paramType: typeof refreshToken,
          },
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
      });

      const encryptedRefreshToken = await encrypt(refreshToken, ENV_VALUES.ENCRYPTION_SECRET);

      await Credential.findOneAndUpdate(
        {userId: userId, type: 'zoom'},
        {
          $set: {
            'credentials.refresh_token': encryptedRefreshToken,
          },
        }
      );

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'updateZoomRefreshToken',
        functionParams: [
          {
            paramName: 'refreshToken',
            paramValue: refreshToken,
            paramType: typeof refreshToken,
          },
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
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
        functionName: 'updateZoomRefreshToken',
        functionParams: [
          {
            paramName: 'refreshToken',
            paramValue: refreshToken,
            paramType: typeof refreshToken,
          },
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
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
