import {SUBSCRIPTIONS_EVENTS} from '../../../../constants/enums';
import Message from '../../../../MongoModels/Message';
import pubSub from '../pubSub';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import Conversation from '../../../../MongoModels/Conversation';

export default async function createChatMessage(
  parent,
  {senderEmail, createdAt, receiverEmail, conversationId, message},
  context
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
  let startLogId: String;
  const functionParams = [
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
      paramName: 'message',
      paramValue: message,
      paramType: typeof message,
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
      functionName: 'createChatMessage',
      functionParams: functionParams,
    });
    const senderUser = await User.findOne({'accountDetails.email': senderEmail}, [
      '_id',
      'accountDetails.avatar',
      'accountDetails.username',
    ]);
    const receiverUser = await User.findOne({'accountDetails.email': receiverEmail}, ['_id']);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const {_id} = await Message.create({
      sender: senderUser?._id,
      receiver: receiverUser?._id,
      message: message,
      createdAt:createdAt,
      conversationId: conversationId,
      unread: true,
    });

    const conversation = await Conversation.findById(conversationId);
    if (conversation.hidden.length > 0) {
      conversation.hidden = [];
      await conversation.save();
    }

    
    const unreadMessageCount = await Message.count({
      receiver: receiverUser?._id,
      unread: true,
    });
    
    pubSub.publish(SUBSCRIPTIONS_EVENTS.CREATE_MESSAGE_EVENT, {
      newMessage: {
        _id,
        senderEmail,
        receiverEmail,
        message,
        username: senderUser?.accountDetails?.username,
        avatar: senderUser?.accountDetails?.avatar,
        conversationId,
        unreadMessageCount:unreadMessageCount,
        blocked:conversation.blocked,
        createdAt,
        email: receiverEmail,
      },
    });

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'createChatMessage',
      functionParams: functionParams,
      additionalMessage: 'Message is Sent Successfully!',
      startLogId,
    });

    return {
      messageId: _id,
      response: {
        status: 200,
        message: 'The Sent Successfully',
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createChatMessage',
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
      functionName: 'createChatMessage',
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
