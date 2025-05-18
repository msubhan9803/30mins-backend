import Service from '../../../../MongoModels/Service';

import jwt, {decode} from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SERVICE_TYPES} from '../../../../constants/enums';
import Conversation from '../../../../MongoModels/Conversation';
import User from '../../../../MongoModels/User';

export default async function archiveConversation(
  parent,
  {documentId, archivedEmail},
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
      paramName: 'isArchived',
      paramValue: archivedEmail,
      paramType: typeof archivedEmail,
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
      functionName: 'archiveConversation',
      functionParams: functionParams,
    });

    const conversationHasarshived = await Conversation.findById(documentId);
    const EmailIndex = conversationHasarshived?.archived?.indexOf(archivedEmail);
    if (EmailIndex === -1) {
      await Conversation.findByIdAndUpdate(documentId, {
        $push: {
          archived: archivedEmail,
        },
      });
    } else {
      await Conversation.findByIdAndUpdate(documentId, {
        $pull: {
          archived: archivedEmail,
        },
      });
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'archiveConversation',
      functionParams: functionParams,
      additionalMessage:
        EmailIndex === -1 ? 'Conversation is now archived!' : 'Conversation is now activated!',
      startLogId,
    });

    return {
      message:
        EmailIndex === -1 ? 'Conversation is now archived!' : 'Conversation is now activated!',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'archiveConversation',
        functionParams: functionParams,
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'archiveConversation',
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
