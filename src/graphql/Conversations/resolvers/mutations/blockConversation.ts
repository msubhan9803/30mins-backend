import Service from '../../../../MongoModels/Service';

import jwt, {decode} from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SERVICE_TYPES} from '../../../../constants/enums';
import Conversation from '../../../../MongoModels/Conversation';
import User from '../../../../MongoModels/User';

export default async function blockConversation(parent, {documentId, emailBlocker}, context, info) {
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
      paramName: 'emailBlocker',
      paramValue: emailBlocker,
      paramType: typeof emailBlocker,
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
      functionName: 'blockConversation',
      functionParams: functionParams,
    });

    const hasPermission = await Conversation.exists({
      _id: documentId,
      members: {$elemMatch: {$eq: decodedToken.UserId}},
    });

    if (!hasPermission) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createConversation',
        functionParams: functionParams,
        additionalMessage: 'Not Authenticated:  The user does not have the block permission',
        startLogId,
      });

      return {
        message: 'Not Authenticated: The user does not have the block permission',
        status: 401,
      };
    }

    const conversation = await Conversation.findById(documentId);
    let newblockedList = [];
    
    if (conversation.blocked.includes(emailBlocker)) {
      newblockedList = conversation.blocked.filter(el => el !== emailBlocker);
    } else {
      newblockedList = [...conversation.blocked, emailBlocker];
    }
    await Conversation.findByIdAndUpdate(documentId, {
      blocked: newblockedList,
    });
    

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'blockConversation',
      functionParams: functionParams,
      additionalMessage: !conversation.blocked.includes(emailBlocker) ? 'Conversation is now blocked!' : 'Conversation is now unblocked!',
      startLogId,
    });

    return {
      message: !conversation.blocked.includes(emailBlocker) ? 'Conversation is now blocked!' : 'Conversation is now unblocked!',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'blockConversation',
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
      functionName: 'blockConversation',
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
