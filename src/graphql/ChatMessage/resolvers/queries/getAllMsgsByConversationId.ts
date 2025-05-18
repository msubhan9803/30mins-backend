import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import Conversation from '../../../../MongoModels/Conversation';
import Message from '../../../../MongoModels/Message';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getAllMsgsByConversationId(
  parent,
  {conversationId, paginationArgs},
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
      paramName: 'paginationArgs',
      paramValue: paginationArgs,
      paramType: typeof paginationArgs,
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
      functionName: 'getAllMsgsByConversationId',
      functionParams: functionParams,
    });

    const messagesDb = await Message.find({
      conversationId,
      $or: [{receiver: {$eq: decodedToken.UserId}}, {sender: {$eq: decodedToken.UserId}}],
    })
      .populate('sender', ['accountDetails.email'])
      .populate('receiver', ['accountDetails.email'])
      .sort({createdAt: -1})
      .skip(
        paginationArgs?.pageNumber * paginationArgs?.resultsPerPage - paginationArgs?.resultsPerPage
      )
      .limit(paginationArgs?.resultsPerPage);

    const messages = messagesDb.map(msg => {
      return {
        _id: msg._id,
        senderEmail: msg.sender.accountDetails.email,
        receiverEmail: msg.receiver.accountDetails.email,
        message: msg.message,
        conversationId: msg.conversationId,
        createdAt: msg.createdAt,
      };
    });
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getAllMsgsByConversationId',
      functionParams: functionParams,
      additionalMessage: 'Get All Message Successfull!',
      startLogId,
    });

    return {
      messages,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getAllMsgsByConversationId',
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
      functionName: 'getAllMsgsByConversationId',
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
