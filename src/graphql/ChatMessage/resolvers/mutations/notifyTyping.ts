import Message from '../../../../MongoModels/Message';
import pubSub from '../pubSub';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SUBSCRIPTIONS_EVENTS} from '../../../../constants/enums';

export default async function notifyTyping(
  parent,
  {message, senderEmail, receiverEmail, conversationId},
  context
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
  let startLogId: String;
  const functionParams = [
    {
      paramName: 'message',
      paramValue: message,
      paramType: typeof message,
    },
    {
      paramName: 'senderEmail',
      paramValue: senderEmail,
      paramType: typeof senderEmail,
    },
    {
      paramName: 'receiverEmail',
      paramValue: receiverEmail,
      paramType: typeof receiverEmail,
    },
    {
      paramName: 'conversationId',
      paramValue: conversationId,
      paramType: typeof conversationId,
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
      functionName: 'notifyTyping',
      functionParams: functionParams,
    });

    pubSub.publish(SUBSCRIPTIONS_EVENTS.STARTED_TYPING, {
      startedTyping: {
        senderEmail,
        receiverEmail,
        conversationId,
        message,
      },
    });
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'notifyTyping',
      functionParams: functionParams,
      additionalMessage: 'Message is Sent Successfully!',
      startLogId,
    });

    return {
      status: 200,
      message: 'Typing mutation is successfull',
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'notifyTyping',
        functionParams: functionParams,
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
      functionName: 'notifyTyping',
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
