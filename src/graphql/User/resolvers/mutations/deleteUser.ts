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
import StatisticsProcessingQueue from '../../../../MongoModels/StatisticsProcessingQueue';
import dayjs from 'dayjs';

export default async function deleteUser(parent, {token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'deleteUser',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const deletedUser = await User.findOneAndDelete({_id: decodedToken.UserId})
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

    await Conversation.deleteMany({members: {$elemMatch: {$eq: deletedUser._id}}});
    await Message.deleteMany({$or: [{receiver: deletedUser._id}, {sender: deletedUser._id}]});
    await RoundRobinTeam.findOneAndUpdate(
      {
        teamMembers: {
          $elemMatch: {memberId: deletedUser._id},
        },
      },
      {$pull: {teamMembers: {memberId: deletedUser._id}}}
    );
    if (deletedUser?.welcomeComplete) {
      await StatisticsProcessingQueue.create({
        schemaName: 'GlobalBussiness',
        fields: {
          totalUsersWelcomeComplete: -1,
        },
        timeStamp: dayjs().toISOString(),
      });
    }
    if (deletedUser?.accountDetails?.verifiedAccount) {
      await StatisticsProcessingQueue.create({
        schemaName: 'GlobalBussiness',
        fields: {
          totalUsersVerified: -1,
        },
        timeStamp: dayjs().toISOString(),
      });
    }
    await StatisticsProcessingQueue.create({
      schemaName: 'GlobalBussiness',
      fields: {
        totalUsersSignedUp: -1,
      },
      timeStamp: dayjs().toISOString(),
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'deleteUser',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'User Deleted Successfully',
      startLogId,
    });

    return {
      message: 'User Deleted Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteUser',
        functionParams: [{paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token}],
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
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'deleteUser',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
