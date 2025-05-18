import Service from '../../../../MongoModels/Service';

import jwt, {decode} from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SERVICE_TYPES} from '../../../../constants/enums';
import Conversation from '../../../../MongoModels/Conversation';
import User from '../../../../MongoModels/User';
import Message from '../../../../MongoModels/Message';

export default async function getConversationByIdByIdById(parent, {documentId}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
  let startLogId: String;
  const functionParams = [
    {
      paramName: 'token',
      paramValue: 'HIDDEN_TOKEN',
      paramType: typeof token,
    },
    {
      paramName: documentId,
      paramValue: documentId,
      paramType: typeof documentId,
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
      functionName: 'getConversationByIdById',
      functionParams: functionParams,
    });

    const conversation = await Conversation.findById(documentId).populate('members', [
      '_id',
      'accountDetails',
      'personalDetails',
    ]);
    // read all message of this chat.
    await Message.updateMany(
      {
        conversationId: documentId,
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
      functionName: 'getConversationByIdById',
      functionParams: functionParams,
      additionalMessage: 'Get Conversation Successfull!',
      startLogId,
    });
    return {
      conversation: conversation,
      response: {
        message: 'Get Conversation Successfull!',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getConversationByIdById',
        functionParams: functionParams,
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
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getConversationByIdById',
      functionParams: functionParams,
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
