import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function updateWorkingHours(parent, {workingHours, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateWorkingHours',
      functionParams: [
        {paramName: 'workingHours', paramValue: workingHours, paramType: typeof workingHours},
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    await User.findByIdAndUpdate(decodedToken.UserId, {
      $set: {
        workingHours: workingHours,
      },
    }).exec();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateWorkingHours',
      functionParams: [
        {paramName: 'workingHours', paramValue: workingHours, paramType: typeof workingHours},
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Working Hours Updated Successfully',
      startLogId,
    });

    return {
      message: 'Working Hours Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateWorkingHours',
        functionParams: [
          {paramName: 'workingHours', paramValue: workingHours, paramType: typeof workingHours},
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
        functionName: 'updateWorkingHours',
        functionParams: [
          {paramName: 'workingHours', paramValue: workingHours, paramType: typeof workingHours},
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
      functionName: 'updateWorkingHours',
      functionParams: [
        {paramName: 'workingHours', paramValue: workingHours, paramType: typeof workingHours},
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
