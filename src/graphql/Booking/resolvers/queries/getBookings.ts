import BookedMeeting from '../../../../MongoModels/BookedMeeting';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {SERVICE_TYPES} from '../../../../constants/enums';
import dayjs from 'dayjs';
import objectSupport from 'dayjs/plugin/objectSupport';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(objectSupport);
export default async function getBookings(_, {searchParams, token}) {
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  try {
    const {pageNumber, resultsPerPage, isProvider, serviceType, month, year} = searchParams;

    const startDate = dayjs()
      .set('year', year)
      .set('month', month)
      .startOf('month')
      .startOf('day')
      .utc(true)
      .toISOString();

    const endDate = dayjs()
      .set('month', month)
      .set('year', year)
      .endOf('month')
      .endOf('day')
      .utc(true)
      .toISOString();

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getBookings',
      functionParams: [
        {
          paramName: 'searchParams',
          paramValue: searchParams,
          paramType: typeof searchParams,
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

    let constructedQuery = {};

    isProvider
      ? (constructedQuery = {provider: decodedToken.UserId})
      : (constructedQuery = {booker: decodedToken.UserId});
    constructedQuery = {...constructedQuery, startTime: {$gt: startDate, $lte: endDate}};
    if (serviceType) {
      if (serviceType === SERVICE_TYPES.MEETING) {
        constructedQuery = {
          ...constructedQuery,
          $or: [{serviceType: SERVICE_TYPES.MEETING}, {serviceType: SERVICE_TYPES.ROUND_ROBIN}],
        };
      }
      if (serviceType === SERVICE_TYPES.FREELANCING_WORK) {
        constructedQuery = {...constructedQuery, serviceType: SERVICE_TYPES.FREELANCING_WORK};
      }
    }

    const bookings = await BookedMeeting.find(constructedQuery)
      .sort({startTime: 1})
      .skip(pageNumber * resultsPerPage - resultsPerPage)
      .limit(resultsPerPage);

    const bookingCount = await BookedMeeting.count(constructedQuery);

    if (bookings.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getBookings',
        functionParams: [
          {
            paramName: 'searchParams',
            paramValue: searchParams,
            paramType: typeof searchParams,
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
        additionalMessage: 'Document Not Found',
        startLogId,
      });

      return {
        bookingData: bookings,
        bookingCount: bookingCount,
        response: {
          message: 'Document Not Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getBookings',
      functionParams: [
        {
          paramName: 'searchParams',
          paramValue: searchParams,
          paramType: typeof searchParams,
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
      bookingData: bookings,
      bookingCount: bookingCount,
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
        functionName: 'getBookings',
        functionParams: [
          {
            paramName: 'searchParams',
            paramValue: searchParams,
            paramType: typeof searchParams,
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
      functionName: 'getBookings',
      functionParams: [
        {
          paramName: 'searchParams',
          paramValue: searchParams,
          paramType: typeof searchParams,
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
