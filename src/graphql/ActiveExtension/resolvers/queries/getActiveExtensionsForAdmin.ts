import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';
import mongoose from 'mongoose';
const {isValidObjectId} = mongoose;

export default async function getActiveExtensionsForAdmin(parent, {searchParams}, context, info) {
  let startLogId: String;
  let decodedToken: AccessToken;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();
    const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
    decodedToken = jwt.verify(context.token, accessTokenSecret) as unknown as AccessToken;
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getActiveExtensionsForAdmin',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
        {
          paramName: 'searchParams',
          paramValue: searchParams,
          paramType: typeof searchParams,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {message: 'Not Authorized', status: 401},
    };
  }

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getActiveExtensionsForAdmin',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'searchParams',
          paramValue: searchParams,
          paramType: typeof searchParams,
        },
      ],
    });

    const isAdmin = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': 'admin',
    });

    if (!isAdmin) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getActiveExtensionsForAdmin',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'searchParams',
            paramValue: searchParams,
            paramType: typeof searchParams,
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
      };
    }

    const {keywords, pageNumber, resultsPerPage} = searchParams;
    const skipCount = pageNumber * resultsPerPage - resultsPerPage;
    let baseQuery = {};

    if (keywords) {
      const safeKeywords = escapeStringRegexp(keywords);
      const regex = new RegExp(safeKeywords, 'i');
      const keywordsQuery = [];
      keywordsQuery.push({extensionTitle: {$regex: regex}});
      keywordsQuery.push({extensionProductId: {$regex: regex}});
      keywordsQuery.push({status: {$regex: regex}});
      keywordsQuery.push({paymentMethodId: {$regex: regex}});
      keywordsQuery.push({subscriptionId: {$regex: regex}});
      keywordsQuery.push({customerId: {$regex: regex}});

      if (isValidObjectId(keywords)) {
        keywordsQuery.push({userId: keywords});
      }

      baseQuery['$or'] = keywordsQuery;
    }

    const activeExtensions = await ActiveExtension.find(baseQuery)
      .skip(skipCount)
      .limit(resultsPerPage)
      .populate('userId', ['accountDetails.username', '_id']);

    const extensionsCount = await ActiveExtension.count(baseQuery);

    if (activeExtensions.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getActiveExtensionsForAdmin',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'searchParams',
            paramValue: searchParams,
            paramType: typeof searchParams,
          },
        ],
        additionalMessage: 'No Active Exensions Found',
        startLogId,
      });

      return {
        activeExtensionData: activeExtensions,
        response: {
          message: 'No Active Exensions Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getActiveExtensionsForAdmin',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'searchParams',
          paramValue: searchParams,
          paramType: typeof searchParams,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      activeExtensionData: activeExtensions,
      extensionsCount,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getActiveExtensionsForAdmin',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'searchParams',
          paramValue: searchParams,
          paramType: typeof searchParams,
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
