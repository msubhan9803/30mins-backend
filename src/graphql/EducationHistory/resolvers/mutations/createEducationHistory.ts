import EducationHistory from '../../../../MongoModels/EducationHistory';
import User from '../../../../MongoModels/User';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function createEducationHistory(
  parent,
  {educationHistoryData, token},
  context,
  info
) {
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createEducationHistory',
      functionParams: [
        {
          paramName: 'educationHistoryData',
          paramValue: educationHistoryData,
          paramType: typeof educationHistoryData,
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
      degree,
      school,
      startDate,
      endDate,
      current,
      graduated,
      additionalInfo,
      extracurricular,
      fieldOfStudy,
    } = educationHistoryData;

    const createdEducationHistory = await EducationHistory.create({
      userId: decodedToken.UserId,
      degree,
      school,
      startDate,
      endDate,
      current,
      graduated,
      additionalInfo,
      extracurricular,
      fieldOfStudy,
    });

    const updatedUser = await User.findByIdAndUpdate(decodedToken.UserId, {
      $push: {
        educationHistory: createdEducationHistory._id,
      },
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createEducationHistory',
      functionParams: [
        {
          paramName: 'educationHistoryData',
          paramValue: educationHistoryData,
          paramType: typeof educationHistoryData,
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
      additionalMessage: 'Education History Created Successfully',
      startLogId,
    });

    return {
      message: 'Education History Created Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createEducationHistory',
        functionParams: [
          {
            paramName: 'educationHistoryData',
            paramValue: educationHistoryData,
            paramType: typeof educationHistoryData,
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

    if (err?._message === 'EducationHistory validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createEducationHistory',
        functionParams: [
          {
            paramName: 'educationHistoryData',
            paramValue: educationHistoryData,
            paramType: typeof educationHistoryData,
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
        additionalMessage: 'Mongoose EducationHistory Validation Failed',
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
      functionName: 'createEducationHistory',
      functionParams: [
        {
          paramName: 'educationHistoryData',
          paramValue: educationHistoryData,
          paramType: typeof educationHistoryData,
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
