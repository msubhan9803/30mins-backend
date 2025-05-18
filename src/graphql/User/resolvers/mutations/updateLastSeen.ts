import jwt, {decode} from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

export default async function updateLastSeen(parent, {documentId, isBlocked}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

  try {
    const now = new Date();
    const user = await User.findByIdAndUpdate(
      decodedToken.UserId,
      {
        $set: {
          lastSeen: now,
        },
      },
      ['lastSeen', 'accountDetails']
    );

    return {
      lastSeen: now,
      accoutDetails: user.accountDetails,
      online: true,
      response: {
        message: 'Update the status successfully!',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    return {
      message: err.message,
      status: 500,
    };
  }
}
