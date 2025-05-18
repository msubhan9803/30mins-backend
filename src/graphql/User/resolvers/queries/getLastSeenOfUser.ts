import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getLastSeenOfUser(parent, {email}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

  try {
    const user = await User.findOne({'accountDetails.email': email}, [
      'lastSeen',
      'accountDetails',
    ]);

    let online = false;

    if (new Date().getTime() / 1000 - new Date(user?.lastSeen).getTime() / 1000 <= 60) {
      online = true;
    }

    return {
      lastSeen: user?.lastSeen,
      accountDetails: user?.accountDetails,
      online: online,
      response: {
        message: 'Successfully recieved the last Seen!',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return {
        response: {
          message: err.message,
          status: 500,
        },
      };
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    return {
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
