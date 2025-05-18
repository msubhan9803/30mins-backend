import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Organization from '../../../../MongoModels/Organization';

export default async function getResultsForMarketer(parent, {searchParams}, context) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const {token} = context;

  let startLogId: String;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const user = await User.findById(decodedToken.UserId);
    const {keywords, pageNumber, resultsPerPage, searchType} = searchParams;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getResultsForMarketer',
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

    if (!user?.isMarketer) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getResultsForMarketer',
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
        additionalMessage: 'Invalid Permissions: Missing Marketer Permissions',
        startLogId,
      });

      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    let returnData = [];
    let returnDataCount = 0;
    const baseQuery = {
      createdBy: user._id,
      affiliateTeamCreatedBy: '',
      $or: [],
    };

    if (user?.affiliateTeam) {
      delete baseQuery.createdBy;
      baseQuery.affiliateTeamCreatedBy = user.affiliateTeam;
    } else {
      delete baseQuery.affiliateTeamCreatedBy;
    }

    if (searchType === 'USERS') {
      if (keywords) {
        const keywordsQuery = [];
        const safeKeywords = escapeStringRegexp(keywords);
        const regex = new RegExp(safeKeywords, 'i');
        keywordsQuery.push({'accountDetails.username': {$regex: regex}});
        keywordsQuery.push({'accountDetails.email': {$regex: regex}});
        keywordsQuery.push({'locationDetails.country': {$regex: regex}});
        keywordsQuery.push({'locationDetails.zipCode': {$regex: regex}});
        keywordsQuery.push({'personalDetails.searchTags': {$regex: regex}});
        baseQuery.$or = keywordsQuery;
      }
      if (baseQuery.$or.length === 0) {
        delete baseQuery.$or;
      }

      returnData = await User.find(baseQuery)
        .skip(pageNumber * resultsPerPage - resultsPerPage)
        .limit(resultsPerPage)
        .populate('createdBy', ['accountDetails.username']);

      returnDataCount = await User.count(baseQuery);
    }

    if (searchType === 'ORGANIZATIONS') {
      if (keywords) {
        const keywordsQuery = [];
        const safeKeywords = escapeStringRegexp(keywords);
        const regex = new RegExp(safeKeywords, 'i');
        keywordsQuery.push({title: {$regex: regex}});
        keywordsQuery.push({slug: {$regex: regex}});
        baseQuery.$or = keywordsQuery;
      }

      if (baseQuery.$or.length === 0) {
        delete baseQuery.$or;
      }

      returnData = await Organization.find(baseQuery)
        .skip(pageNumber * resultsPerPage - resultsPerPage)
        .limit(resultsPerPage)
        .populate('createdBy', ['accountDetails.username']);

      returnDataCount = await Organization.count(baseQuery);
    }

    if (returnData.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getResultsForMarketer',
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
        additionalMessage: 'No Results Found',
        startLogId,
      });

      return {
        returnData,
        returnDataCount,
        response: {
          message: 'No Results Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getResultsForMarketer',
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
      returnUserData: searchType === 'USERS' ? returnData : [],
      returnOrgData: searchType === 'ORGANIZATIONS' ? returnData : [],
      returnDataCount,
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
        functionName: 'getResultsForMarketer',
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
      functionName: 'getResultsForMarketer',
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
