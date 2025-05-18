import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import Credential from '../../../../MongoModels/Credential';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function checkUserEmailAndCalendar(parent, {email}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'checkUserEmailAndCalendar',
      functionParams: [
        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const user = await User.findOne(
      {
        'accountDetails.email': email,
      },
      ['_id']
    );

    const userExists = user ? true : false;
    if (!userExists) {
      startLogId = await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'checkUserEmailAndCalendar',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: `The user does not exist with the provided ${email}`,
        startLogId,
      });
      return {
        guestID: user?._id,
        userExists,
        hasCalendar: false,
        response: {
          message: `The user does not exist with the provided ${email}`,
          status: 200,
        },
      };
    }

    const hasCalendar = await Credential.exists({userId: user._id});
    if (!hasCalendar) {
      startLogId = await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'checkUserEmailAndCalendar',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: `The user does not have the calendar with the provided email ${email}`,
        startLogId,
      });

      return {
        guestID: user?._id,
        userExists,
        hasCalendar,
        response: {
          message: `The user does not have the calendar with the provided email ${email}`,
          status: 400,
        },
      };
    }

    return {
      guestID: user?._id,
      userExists,
      hasCalendar,
      response: {
        message: `The user exists and has Calendar.`,
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'checkUserEmailAndCalendar',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
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
      functionName: 'checkUserEmailAndCalendar',
      functionParams: [
        {
          paramName: 'email',
          paramValue: email,
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
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
