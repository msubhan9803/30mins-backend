import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import Conversation from '../../../../MongoModels/Conversation';
import Message from '../../../../MongoModels/Message';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function markReadMessageOfConversation(
  parent,
  {conversationId},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
  let startLogId: String;
  const functionParams = [
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
      functionName: 'markReadMessageOfConversation',
      functionParams: functionParams,
    });

    const messagesDb = await Message.updateMany(
      {
        conversationId: conversationId,
        unread: true,
        receiver: decodedToken.UserId,
      },
      {
        $set: {
          unread: false,
        },
      }
    );

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'markReadMessageOfConversation',
      functionParams: functionParams,
      additionalMessage: 'Marked All Message Read Succesfully',
      startLogId,
    });

    return {
      message: 'Marked All Message Read Succesfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'markReadMessageOfConversation',
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
      functionName: 'markReadMessageOfConversation',
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
