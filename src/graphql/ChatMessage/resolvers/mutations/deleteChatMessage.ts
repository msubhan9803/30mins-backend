import Service from '../../../../MongoModels/Service';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SERVICE_TYPES} from '../../../../constants/enums';
import Conversation from '../../../../MongoModels/Conversation';
import User from '../../../../MongoModels/User';
import Message from '../../../../MongoModels/Message';

export default async function deleteChatMessage(
  parent,
  {documentId, conversationId},
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
  ];
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'deleteChatMessage',
      functionParams: functionParams,
    });

    const hasPermission = await Conversation.exists({
      _id: conversationId,
      members: {$elemMatch: {$eq: decodedToken.UserId}},
    });

    if (!hasPermission) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteChatMessage',
        functionParams: functionParams,
        additionalMessage: 'Not Authenticated:  The user does not have the delete permission',
        startLogId,
      });

      return {
        message: 'Not Authenticated: The user does not have the delete permission',
        status: 401,
      };
    }

    const message = await Message.findByIdAndDelete(documentId);

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'deleteChatMessage',
      functionParams: functionParams,
      additionalMessage: 'Message is Deleted!',
      startLogId,
    });

    return {
      messageId: message._id,
      response: {
        message: 'Message is Deleted!',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteChatMessage',
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
      functionName: 'deleteChatMessage',
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
