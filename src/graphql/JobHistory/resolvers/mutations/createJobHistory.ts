import JobHistory from '../../../../MongoModels/JobHistory';
import User from '../../../../MongoModels/User';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function createJobHistory(parent, {jobHistoryData, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createJobHistory',
      functionParams: [
        {
          paramName: 'jobHistoryData',
          paramValue: jobHistoryData,
          paramType: typeof jobHistoryData,
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

    const createdJobHistory = await JobHistory.create({
      userId: decodedToken.UserId,
      position,
      company,
      startDate,
      endDate,
      current,
      roleDescription,
      employmentType,
      location,
    });

    const updatedUser = await User.findByIdAndUpdate(decodedToken.UserId, {
      $push: {
        jobHistory: createdJobHistory._id,
      },
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createJobHistory',
      functionParams: [
        {
          paramName: 'jobHistoryData',
          paramValue: jobHistoryData,
          paramType: typeof jobHistoryData,
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
      additionalMessage: 'Job History Created Successfully',
      startLogId,
    });

    return {
      message: 'Job History Created Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createJobHistory',
        functionParams: [
          {
            paramName: 'jobHistoryData',
            paramValue: jobHistoryData,
            paramType: typeof jobHistoryData,
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
        level: ApiLogLevels.INFO,
        functionName: 'createJobHistory',
        functionParams: [
          {
            paramName: 'jobHistoryData',
            paramValue: jobHistoryData,
            paramType: typeof jobHistoryData,
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
      level: ApiLogLevels.INFO,
      functionName: 'createJobHistory',
      functionParams: [
        {
          paramName: 'jobHistoryData',
          paramValue: jobHistoryData,
          paramType: typeof jobHistoryData,
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
