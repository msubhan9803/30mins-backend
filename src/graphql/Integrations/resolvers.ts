import {AccessToken} from '../../constants/types';
import Credential from '../../MongoModels/Credential';
import jwt from 'jsonwebtoken';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../utils/createApiLog';
import decryptObject from '../../utils/encryption/decryptObject';
import AwsSecrets from '../../utils/getAwsSecrets';
import User from '../../MongoModels/User';

const queries = {
  getCredentialsByUserId: async (parent, {userId}, context, info) => {
    let startLogId: String;
    const ENV_VALUES = await AwsSecrets.getInstance();

    try {
      if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getCredentialsByUserId',
          functionParams: [
            {
              paramName: 'userId',
              paramValue: userId,
              paramType: typeof userId,
            },
          ],
          additionalMessage: 'Invalid Permissions: Invalid API Key',
        });

        return {
          response: {
            message: 'Not Authenticated',
            status: 401,
          },
        };
      }

      startLogId = await createApiLog({
        type: ApiLogTypes.QUERY_START,
        level: ApiLogLevels.INFO,
        functionName: 'getCredentialsByUserId',
        functionParams: [
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
      });

      const credentialsEncrypted = await Credential.find({
        userId: userId,
      }).exec();

      const credentials = [];

      for await (const credential of credentialsEncrypted) {
        const decryptedCredential = await decryptObject(credential);
        credentials.push(decryptedCredential);
      }

      if (credentials.length === 0) {
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.INFO,
          functionName: 'getCredentialsByUserId',
          functionParams: [
            {
              paramName: 'userId',
              paramValue: userId,
              paramType: typeof userId,
            },
          ],
          additionalMessage: 'Document Not Found',
        });

        return {
          response: {
            message: 'Document Not Found',
            status: 404,
          },
        };
      }

      const officeCredentials = credentials.filter(
        credential => credential.type === 'office365calendar'
      );

      const googleCredentials = credentials.filter(
        credential => credential.type === 'googlecalendar'
      );

      const zoomCredentials = credentials.filter(credential => credential.type === 'zoom');

      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getCredentialsByUserId',
        functionParams: [
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
        additionalMessage: 'Query Successful',
      });

      return {
        officeCredentials: officeCredentials,
        googleCredentials: googleCredentials,
        zoomCredentials: zoomCredentials,
        response: {
          message: 'Query Successful',
          status: 200,
        },
      };
    } catch (err) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCredentialsByUserId',
        functionParams: [
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
        additionalMessage: err.message,
      });

      return {
        response: {
          message: err.message,
          status: 500,
        },
      };
    }
  },

  getCredentialsByToken: async (parent, {token}, context, info) => {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    let startLogId: String;

    try {
      const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

      startLogId = await createApiLog({
        type: ApiLogTypes.QUERY_START,
        level: ApiLogLevels.INFO,
        functionName: 'getCredentialsByToken',
        functionParams: [
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

      const credentialsEncrypted = await Credential.find({
        userId: decodedToken.UserId,
      }).exec();

      const credentials = [];

      for await (const credential of credentialsEncrypted) {
        const decryptedCredential = await decryptObject(credential);
        credentials.push(decryptedCredential);
      }

      if (credentials.length === 0) {
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.INFO,
          functionName: 'getCredentialsByToken',
          functionParams: [
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
          additionalMessage: 'Document Not Found',
          startLogId,
        });

        return {
          response: {
            message: 'Document Not Found',
            status: 404,
          },
        };
      }

      const officeCredentials = credentials.filter(
        credential => credential.type === 'office365calendar'
      );

      const googleCredentials = credentials.filter(
        credential => credential.type === 'googlecalendar'
      );

      const zoomCredentials = credentials.filter(credential => credential.type === 'zoom');

      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getCredentialsByToken',
        functionParams: [
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
        additionalMessage: 'Query Successful',
        startLogId,
      });

      return {
        officeCredentials: officeCredentials,
        googleCredentials: googleCredentials,
        zoomCredentials: zoomCredentials,
        response: {
          message: 'Query Successful',
          status: 200,
        },
      };
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getCredentialsByToken',
          functionParams: [
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
          ],
          additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        });

        return {
          response: {
            message: 'Not Authenticated',
            status: 401,
          },
        };
      }

      const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCredentialsByToken',
        functionParams: [
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
        response: {
          message: err.message,
          status: 500,
        },
      };
    }
  },
  getCredentialsByEmail: async (parent, {email}, context, info) => {
    let startLogId: String;

    try {
      // const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

      startLogId = await createApiLog({
        type: ApiLogTypes.QUERY_START,
        level: ApiLogLevels.INFO,
        functionName: 'getCredentialsByToken',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
        ],
      });

      const user = await User.findOne({
        'accountDetails.email': email,
      }).orFail(() => new Error('User Document Not Found'));

      const credentialsEncrypted = await Credential.find({
        userId: user?._id,
      }).exec();

      const credentials = [];

      for await (const credential of credentialsEncrypted) {
        const decryptedCredential = await decryptObject(credential);
        credentials.push(decryptedCredential);
      }

      if (credentials.length === 0) {
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.INFO,
          functionName: 'getCredentialsByToken',
          functionParams: [
            {
              paramName: 'email',
              paramValue: email,
              paramType: typeof email,
            },
          ],
          additionalMessage: 'Document Not Found',
          startLogId,
        });

        return {
          response: {
            message: 'Document Not Found',
            status: 404,
          },
        };
      }

      const officeCredentials = credentials.filter(credential => {
        return credential.type === 'office365calendar';
      });

      const googleCredentials = credentials.filter(credential => {
        return credential.type === 'googlecalendar';
      });

      const zoomCredentials = credentials.filter(credential => {
        return credential.type === 'zoom';
      });

      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getCredentialsByToken',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
        ],
        additionalMessage: 'Query Successful',
        startLogId,
      });

      return {
        hasOfficeCredentials: officeCredentials?.length > 0,
        hasGoogleCredentials: googleCredentials?.length > 0,
        hasZoomCredentials: zoomCredentials?.length > 0,
        response: {
          message: 'Query Successful',
          status: 200,
        },
      };
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getCredentialsByToken',
          functionParams: [
            {
              paramName: 'email',
              paramValue: email,
              paramType: typeof email,
            },
          ],
          additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        });

        return {
          response: {
            message: 'Not Authenticated',
            status: 401,
          },
        };
      }

      return {
        response: {
          message: err.message,
          status: 500,
        },
      };
    }
  },
};

const mutations = {
  toggleCredentialById: async (parent, {credentialId, token}) => {
    const ENV_VALUES = await AwsSecrets.getInstance();

    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    let startLogId: String;

    try {
      const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

      startLogId = await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.INFO,
        functionName: 'toggleCredentialById',
        functionParams: [
          {
            paramName: 'credentialId',
            paramValue: credentialId,
            paramType: typeof credentialId,
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

      const credentialsEncrypted = await Credential.find({
        userId: decodedToken.UserId,
      }).exec();

      for (let index = 0; index < credentialsEncrypted.length; index++) {
        let credential = credentialsEncrypted[index];
        if (credential.type === 'googlecalendar') {
          if (credential._id.toString() === credentialId) {
            credential.isPrimary = true;
          } else {
            credential.isPrimary = false;
          }

          await credential.save();
        }
      }

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'toggleCredentialById',
        functionParams: [
          {
            paramName: 'credentialId',
            paramValue: credentialId,
            paramType: typeof credentialId,
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
        additionalMessage: 'Credential marked as primary successfully',
        startLogId,
      });

      return {
        message: 'Credential marked as primary successfully',
        status: 200,
      };
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'toggleCredentialById',
          functionParams: [
            {
              paramName: 'credentialId',
              paramValue: credentialId,
              paramType: typeof credentialId,
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

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'toggleCredentialById',
        functionParams: [
          {
            paramName: 'credentialId',
            paramValue: credentialId,
            paramType: typeof credentialId,
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
  },
};

export const resolvers = {queries, mutations};
