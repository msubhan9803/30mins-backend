import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import deleteImageFromBucket from '../../../../utils/deleteImageFromBucket';

import User from '../../../../MongoModels/User';
import Service from '../../../../MongoModels/Service';
import Publication from '../../../../MongoModels/Publication';
import EducationHistory from '../../../../MongoModels/EducationHistory';
import JobHistory from '../../../../MongoModels/JobHistory';
import Credential from '../../../../MongoModels/Credential';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Conversation from '../../../../MongoModels/Conversation';
import Message from '../../../../MongoModels/Message';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';

export default async function adminDeleteUsers(parent, {userIDs}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const {token} = context;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'adminDeleteUsers',
      functionParams: [
        {
          paramName: 'adminUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'userIDs',
          paramValue: userIDs,
          paramType: typeof userIDs,
        },
      ],
    });

    const isAdminUser = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': 'admin',
    });

    if (!isAdminUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminDeleteUsers',
        functionParams: [
          {
            paramName: 'userIDs',
            paramValue: userIDs,
            paramType: typeof userIDs,
          },
        ],
        additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
        startLogId,
      });
      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
        userIDs: [],
      };
    }

    userIDs.forEach(async _id => {
      const deletedUser = await User.findOneAndDelete({_id})
        .orFail(() => new Error('Document Not Found'))
        .exec();

      if (deletedUser.accountDetails.avatar) {
        await deleteImageFromBucket(deletedUser.accountDetails.avatar);
      }

      await Service.deleteMany({userId: deletedUser._id}).exec();
      await Publication.deleteMany({userId: deletedUser._id}).exec();
      await EducationHistory.deleteMany({userId: deletedUser._id}).exec();
      await JobHistory.deleteMany({userId: deletedUser._id}).exec();
      await Credential.deleteMany({userId: deletedUser._id}).exec();
      await OrganizationMembership.deleteMany({userId: deletedUser._id}).exec();
      await ActiveExtension.deleteMany({userId: deletedUser._id}).exec();
      await Conversation.deleteMany({members: {$in: [deletedUser._id]}});
      await Message.deleteMany({$or: [{receiver: deletedUser._id}, {sender: deletedUser._id}]});
      await RoundRobinTeam.findOneAndUpdate(
        {
          teamMembers: {
            $elemMatch: {memberId: deletedUser._id},
          },
        },
        {$pull: {teamMembers: {memberId: deletedUser._id}}}
      );

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'adminDeleteUsers',
        functionParams: [
          {
            paramName: 'adminUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'userIDs',
            paramValue: userIDs,
            paramType: typeof userIDs,
          },
        ],
        additionalMessage: `User with id: ${_id} Deleted Successfully`,
        startLogId,
      });
    });
    return {
      response: {
        message: 'Users Deleted Successfully By Admin',
        status: 200,
      },
      userIDs: userIDs,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'adminDeleteUsers',
        functionParams: [
          {
            paramName: 'userIDs',
            paramValue: userIDs,
            paramType: typeof userIDs,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });
      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
        userIDs: [],
      };
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'adminDeleteUsers',
      functionParams: [
        {
          paramName: 'adminUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'userIDs',
          paramValue: userIDs,
          paramType: typeof userIDs,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });
    return {
      response: {
        message: err.message,
        status: 500,
      },
      userIDs: [],
    };
  }
}
