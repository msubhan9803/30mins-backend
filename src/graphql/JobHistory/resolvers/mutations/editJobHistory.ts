import JobHistory from '../../../../MongoModels/JobHistory';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function editJobHistory(
  parent,
  {jobHistoryData, documentId, token},
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
      functionName: 'editJobHistory',
      functionParams: [
        {
          paramName: 'jobHistoryData',
          paramValue: jobHistoryData,
          paramType: typeof jobHistoryData,
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
      position,
      company,
      startDate,
      endDate,
      current,
      roleDescription,
      employmentType,
      location,
    } = jobHistoryData;

    const updatedJobHistory = await JobHistory.findOneAndUpdate(
      {
        userId: decodedToken.UserId,
        _id: documentId,
      },
      {
        $set: {
          position,
          company,
          startDate,
          endDate,
          current,
          roleDescription,
          employmentType,
          location,
        },
      }
    );

    if (!updatedJobHistory) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editJobHistory',
        functionParams: [
          {
            paramName: 'jobHistoryData',
            paramValue: jobHistoryData,
            paramType: typeof jobHistoryData,
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
        additionalMessage: 'Document Not Found',
        startLogId,
      });

      return {
        message: 'Document Not Found',
        status: 404,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'editJobHistory',
      functionParams: [
        {
          paramName: 'jobHistoryData',
          paramValue: jobHistoryData,
          paramType: typeof jobHistoryData,
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
      additionalMessage: 'Job History Updated Successfully',
      startLogId,
    });

    return {
      message: 'Job History Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editJobHistory',
        functionParams: [
          {
            paramName: 'jobHistoryData',
            paramValue: jobHistoryData,
            paramType: typeof jobHistoryData,
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

    if (err?._message === 'JobHistory validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editJobHistory',
        functionParams: [
          {
            paramName: 'jobHistoryData',
            paramValue: jobHistoryData,
            paramType: typeof jobHistoryData,
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
        additionalMessage: 'Mongoose JobHistory Validation Failed',
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
      functionName: 'editJobHistory',
      functionParams: [
        {
          paramName: 'jobHistoryData',
          paramValue: jobHistoryData,
          paramType: typeof jobHistoryData,
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
