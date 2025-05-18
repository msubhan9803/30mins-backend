import Service from '../../../../MongoModels/Service';

import jwt, {decode} from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SERVICE_TYPES} from '../../../../constants/enums';
import Conversation from '../../../../MongoModels/Conversation';
import User from '../../../../MongoModels/User';
import Message from '../../../../MongoModels/Message';

export default async function getAllConversations(parent, {paginationArgs}, context, info) {
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
      paramName: 'userId',
      paramValue: decodedToken.UserId,
      paramType: typeof decodedToken.UserId,
    },
  ];
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getAllConversations',
      functionParams: functionParams,
    });
    const conversations = await Conversation.find({
      members: {
        $elemMatch: {$eq: decodedToken.UserId},
      },
    })
      .sort({createdAt: -1})
      .populate('members', ['personalDetails', 'accountDetails'])
      .skip(
        paginationArgs?.pageNumber * paginationArgs?.resultsPerPage - paginationArgs?.resultsPerPage
      )
      .limit(paginationArgs?.resultsPerPage);
    const conversationIds = conversations.map(c => c._id);
    let sortedConversations = await Promise.all(
      conversations.map(async conversation => {
        const message = await Message.find(
          {conversationId: conversation._id},
          ['_id', 'createdAt', 'message'],
          {limit: 1}
        ).sort({$natural: -1});
        const unreadMessageCount = await Message.count({
          receiver: decodedToken.UserId,
          conversationId: conversation._id,
          unread: true,
        });

        conversation._doc.unreadMessageCount = unreadMessageCount;
        return {...conversation, lastMessage: message};
      })
    );
    sortedConversations = sortedConversations.sort((a, b) => {
      return (
        new Date(b?.lastMessage[0]?.createdAt || 0).getTime() -
        new Date(a?.lastMessage[0]?.createdAt || 0).getTime()
      );
    });

    sortedConversations = sortedConversations.map(doc => doc._doc);

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getAllConversations',
      functionParams: functionParams,
      additionalMessage: 'Get All Conversation Successfull!',
      startLogId,
    });

    return {
      conversations: sortedConversations,
      response: {
        message: 'Get All Conversation Successfull!',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getAllConversations',
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
      functionName: 'getAllConversations',
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
