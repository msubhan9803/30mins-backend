import BookedMeeting from '../../../../MongoModels/BookedMeeting';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Service from '../../../../MongoModels/Service';
import dayjs from 'dayjs';

export default async function getCurrentSlotBookings(
  parent,
  {serviceID, startTime, endTime, attendeeLimit},
  context,
  info
) {
  const {token} = context;
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
  let functionParams = [
    {
      paramName: 'serviceID',
      paramValue: serviceID,
      paramType: typeof serviceID,
    },
    {
      paramName: 'startTime',
      paramValue: startTime,
      paramType: typeof startTime,
    },
    {
      paramName: 'endTime',
      paramValue: endTime,
      paramType: typeof endTime,
    },
    {
      paramName: 'attendeeLimit',
      paramValue: attendeeLimit,
      paramType: typeof attendeeLimit,
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

  let startLogId: String;
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getCurrentSlotBookings',
      functionParams: functionParams,
    });

    const service = await Service.findById(serviceID, ['attendeeLimit']);
    const bookingCount = await BookedMeeting.count({serviceId: serviceID, startTime, endTime});
    if (bookingCount => service.attendeeLimit) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCurrentSlotBookings',
        functionParams: functionParams,
        additionalMessage: 'Slots Booked!, Booker all slots are booked!',
        startLogId,
      });
      return {
        numOfBookedSlot: bookingCount,
        response: {
          message: 'Slots Booked!, Booker all slots are booked!',
          status: 401,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getCurrentSlotBookings',
      functionParams: functionParams,
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      numOfBookedSlot: bookingCount,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      functionParams.pop();
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCurrentSlotBookings',
        functionParams: functionParams,
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
      functionName: 'getCurrentSlotBookings',
      functionParams: functionParams,
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {message: err.message, status: 500},
    };
  }
}
