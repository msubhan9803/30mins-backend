import PendingPayout from '../../../../MongoModels/PendingPayout';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import dayjs from 'dayjs';
import objectSupport from 'dayjs/plugin/objectSupport';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {EscrowReleaseStatus} from '../../../../constants/enums';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(objectSupport);
export default async function getPendingPayouts(_, {searchParams, token}) {
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  try {
    const {pageNumber, resultsPerPage, showReleased} = searchParams;

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getPendingPayouts',
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

    const payouts = await PendingPayout.find({
      status: showReleased ? EscrowReleaseStatus.RELEASED : EscrowReleaseStatus.UNRELEASED,
    })
      .sort({startTime: 1})
      .skip(pageNumber * resultsPerPage - resultsPerPage)
      .limit(resultsPerPage)
      .exec();

    const payoutCount = await PendingPayout.count({
      status: showReleased ? EscrowReleaseStatus.RELEASED : EscrowReleaseStatus.UNRELEASED,
    });

    if (payouts.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getPendingPayouts',
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
        payoutData: payouts,
        payoutCount: payoutCount,
        response: {
          message: 'Document Not Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getPendingPayouts',
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
      payoutData: payouts,
      payoutCount: payoutCount,
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
        functionName: 'getPendingPayouts',
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
      functionName: 'getPendingPayouts',
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
