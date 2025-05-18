import Service from '../../../../MongoModels/Service';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SERVICE_TYPES} from '../../../../constants/enums';
import Conversation from '../../../../MongoModels/Conversation';
import User from '../../../../MongoModels/User';

export default async function createConversation(parent, {membersEmail}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
  let startLogId: String;
  const functionParams = [
    {
      paramName: 'membersEmail',
      paramValue: membersEmail,
      paramType: typeof membersEmail,
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
      functionName: 'createConversation',
      functionParams: functionParams,
    });

    let userIds: any = await User.find(
      {
        'accountDetails.email': {
          $in: membersEmail,
        },
      },
      ['_id', 'accountDetails.email']
    ).orFail(() => {
      throw new Error('Document not Found!');
    });

    if (userIds.length !== 2) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createConversation',
        functionParams: functionParams,
        additionalMessage: 'Emails are not Valid!',
        startLogId,
      });
      return {
        response: {
          message: 'Please Provide valid Emails!',
          status: 400,
        },
      };
    }
    const userEmail = userIds.filter(el => el._id.toString() === decodedToken.UserId.toString())[0]
      .accountDetails.email;

    userIds = userIds.map(u => u._id);

    const conversationFound = await Conversation.findOne({
      members: userIds,
    });

    if (conversationFound) {
      conversationFound.hidden.pop(userEmail);
      conversationFound.archived.pop(userEmail);
      conversationFound.blocked.pop(userEmail);
      await conversationFound.save();
      return {
        conversationID: conversationFound._id,
        response: {
          message: 'Conversation is already exists!',
          status: 200,
        },
      };
    }

    const conversation = await Conversation.create({
      members: userIds,
    });

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'createConversation',
      functionParams: functionParams,
      additionalMessage: 'Conversation is created Successfully!',
      startLogId,
    });

    return {
      conversationID: conversation._id,
      response: {
        message: 'Conversation created Succesfully!',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createConversation',
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
      functionName: 'createConversation',
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
