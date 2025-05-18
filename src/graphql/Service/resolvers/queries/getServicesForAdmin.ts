import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import Service from '../../../../MongoModels/Service';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getServicesForAdmin(
  parent,
  {serviceSearchParams, token},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const user = await User.findById(decodedToken.UserId, 'accountDetails.accountType').exec();
    const {keywords, isOrgService, pageNumber, resultsPerPage} = serviceSearchParams;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getServicesForAdmin',
      functionParams: [
        {
          paramName: 'serviceSearchParams',
          paramValue: serviceSearchParams,
          paramType: typeof serviceSearchParams,
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

    if (user.accountDetails.accountType !== 'admin') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getServicesForAdmin',
        functionParams: [
          {
            paramName: 'serviceSearchParams',
            paramValue: serviceSearchParams,
            paramType: typeof serviceSearchParams,
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
        additionalMessage: 'Invalid Permissions: Missing Admin Permissions',
        startLogId,
      });

      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    let baseQuery = {};
    let keywordsQuery = [];
    const safeKeywords = escapeStringRegexp(keywords);
    const regex = new RegExp(safeKeywords, 'i');

    if (keywords) {
      keywordsQuery.push({title: {$regex: regex}});
      keywordsQuery.push({slug: {$regex: regex}});
      keywordsQuery.push({currency: {$regex: regex}});
      if (parseInt(keywords)) {
        keywordsQuery.push({duration: parseInt(keywords)});
      }
      baseQuery['$or'] = keywordsQuery;
    }

    if (isOrgService) {
      baseQuery['isOrgService'] = isOrgService;
      keywordsQuery.push({organizationName: {$regex: regex}});
    }

    const services = await Service.find(baseQuery)
      .skip(pageNumber * resultsPerPage - resultsPerPage)
      .limit(resultsPerPage)
      .populate('userId', ['accountDetails.username', 'personalDetails.name'])
      .exec();

    const serviceCount = await Service.count(baseQuery).exec();

    if (services.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getServicesForAdmin',
        functionParams: [
          {
            paramName: 'serviceSearchParams',
            paramValue: serviceSearchParams,
            paramType: typeof serviceSearchParams,
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
        additionalMessage: 'No Users Found',
        startLogId,
      });

      return {
        serviceData: services,
        serviceCount,
        response: {
          message: 'No Users Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getServicesForAdmin',
      functionParams: [
        {
          paramName: 'serviceSearchParams',
          paramValue: serviceSearchParams,
          paramType: typeof serviceSearchParams,
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
      serviceData: services,
      serviceCount,
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
        functionName: 'getServicesForAdmin',
        functionParams: [
          {
            paramName: 'serviceSearchParams',
            paramValue: serviceSearchParams,
            paramType: typeof serviceSearchParams,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Invalid Permissions: JWT Token Invalid',
        startLogId,
      });

      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getServicesForAdmin',
      functionParams: [
        {
          paramName: 'serviceSearchParams',
          paramValue: serviceSearchParams,
          paramType: typeof serviceSearchParams,
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
