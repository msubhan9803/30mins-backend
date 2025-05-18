import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

import User from '../../../../MongoModels/User';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import escapeStringRegexp from 'escape-string-regexp';
import deleteImageFromBucket from '../../../../utils/deleteImageFromBucket';
import Service from '../../../../MongoModels/Service';
import Publication from '../../../../MongoModels/Publication';
import EducationHistory from '../../../../MongoModels/EducationHistory';
import JobHistory from '../../../../MongoModels/JobHistory';
import Credential from '../../../../MongoModels/Credential';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import Conversation from '../../../../MongoModels/Conversation';
import Message from '../../../../MongoModels/Message';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';

export default async function marketerDeleteUser(parent, {userEmail}, context) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'marketerDeleteUser',
      functionParams: [
        {
          paramName: 'marketerId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'userEmail',
          paramValue: userEmail,
          paramType: typeof userEmail,
        },
      ],
    });

    const marketingUser = await User.findOne({
      _id: decodedToken.UserId,
      isMarketer: true,
    });

    if (!marketingUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerDeleteUser',
        functionParams: [
          {
            paramName: 'userEmail',
            paramValue: userEmail,
            paramType: typeof userEmail,
          },
        ],
        additionalMessage: 'Not Authenticated: User Lacks Marketer Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const safeEmail = escapeStringRegexp(userEmail);
    const emailPattern = `^${safeEmail}$`;
    const emailRegex = new RegExp(emailPattern, 'i');

    const deletedUser = await User.findOneAndDelete({
      'accountDetails.email': {$regex: emailRegex},
      welcomeComplete: false,
      $or: [{createdBy: marketingUser._id}, {affiliateTeamCreatedBy: marketingUser.affiliateTeam}],
    });

    if (!deletedUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'marketerDeleteUser',
        functionParams: [
          {paramName: 'userEmail', paramValue: userEmail, paramType: typeof userEmail},
        ],
        additionalMessage: 'User Not Found',
        startLogId,
      });

      return {
        message: 'User Not Found',
        status: 404,
      };
    }

    if (deletedUser.accountDetails.avatar) {
      await deleteImageFromBucket(deletedUser.accountDetails.avatar);
    }

    await Service.deleteMany({userId: deletedUser._id});
    await Publication.deleteMany({userId: deletedUser._id});
    await EducationHistory.deleteMany({userId: deletedUser._id});
    await JobHistory.deleteMany({userId: deletedUser._id});
    await Credential.deleteMany({userId: deletedUser._id});
    await OrganizationMembership.deleteMany({userId: deletedUser._id});
    await ActiveExtension.deleteMany({userId: deletedUser._id});

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

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'marketerDeleteUser',
      functionParams: [
        {
          paramName: 'marketerId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'userEmail',
          paramValue: userEmail,
          paramType: typeof userEmail,
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
        functionName: 'marketerDeleteUser',
        functionParams: [
          {
            paramName: 'userEmail',
            paramValue: userEmail,
            paramType: typeof userEmail,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'marketerDeleteUser',
      functionParams: [
        {
          paramName: 'userEmail',
          paramValue: userEmail,
          paramType: typeof userEmail,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    console.log(err);

    return {
      message: err.message,
      status: 500,
    };
  }
}
