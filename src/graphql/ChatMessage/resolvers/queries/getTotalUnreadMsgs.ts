import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import Conversation from '../../../../MongoModels/Conversation';
import Message from '../../../../MongoModels/Message';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getTotalUnreadMsgs(parent, {receiverEmail}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
  let startLogId: String;
  const functionParams = [
    {
      paramName: 'receiverEmail',
      paramValue: receiverEmail,
      paramType: typeof receiverEmail,
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
  ];
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getTotalUnreadMsg',
      functionParams: functionParams,
    });

    const unreadMessageCount = await Message.count({
      receiver: decodedToken.UserId,
      unread: true,
    });

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getTotalUnreadMsg',
      functionParams: functionParams,
      additionalMessage: 'Count All Unread Message Successfull!',
      startLogId,
    });

    return {
      unreadMessageCount,
      response: {
        message: 'query succesfull',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getTotalUnreadMsg',
        functionParams: functionParams,
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });

      return {
        response: {
          message: err.message,
          status: 500,
        },
      };
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getTotalUnreadMsg',
      functionParams: functionParams,
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
