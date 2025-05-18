import BookedMeeting from '../../../../MongoModels/BookedMeeting';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

export default async function getBookingById(parent, {token, documentId}, context, info) {
  const SECRETS = await AwsSecrets.getInstance();

  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    let decodedToken = {UserId: undefined};

    if (token) {
      decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getBookingById',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
      ],
    });
    let query = {
      _id: documentId,
    };

    if (decodedToken.UserId && token) {
      const isAdmin = await User.exists({
        _id: decodedToken.UserId,
        'accountDetails.accountType': 'admin',
      });

      if (!isAdmin) {
        query = {
          _id: documentId,
          $or: [{provider: decodedToken.UserId}, {booker: decodedToken.UserId}],
        };
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getBookingsForAdmin',
          functionParams: [
            {
              paramName: 'getBookingById',
              paramValue: documentId,
              paramType: typeof documentId,
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
          ],
          additionalMessage: 'Not Authenticated as Admin Continues the Flow of GetBookingById',
          startLogId,
        });
      }
    }

    const booking = await BookedMeeting.findOne(query)
      .orFail(() => new Error('Document Not Found'))
      .exec();

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getBookingById',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      bookingData: booking,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getBookingById',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
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

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getBookingById',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {message: err.message, status: 500},
    };
  }
}
