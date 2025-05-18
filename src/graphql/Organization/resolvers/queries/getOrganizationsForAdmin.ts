import jwt from 'jsonwebtoken';
import escapeStringRegexp from 'escape-string-regexp';
import {AccessToken} from '../../../../constants/types';
import Organization from '../../../../MongoModels/Organization';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

export default async function getOrganizationsForAdmin(parent, {orgSearchParams}, context, info) {
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
      functionName: 'getOrganizationsForAdmin',
      functionParams: [
        {
          paramName: 'orgSearchParams',
          paramValue: orgSearchParams,
          paramType: typeof orgSearchParams,
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
    const {keywords, location, pageNumber, resultsPerPage} = orgSearchParams;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getOrganizationsForAdmin',
      functionParams: [
        {
          paramName: 'orgSearchParams',
          paramValue: orgSearchParams,
          paramType: typeof orgSearchParams,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const isAdminUser = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': 'admin',
    });

    if (!isAdminUser) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getOrganizationsForAdmin',
        functionParams: [
          {
            paramName: 'orgSearchParams',
            paramValue: orgSearchParams,
            paramType: typeof orgSearchParams,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    let baseQuery = {$and: []};
    let skipCount = pageNumber * resultsPerPage - resultsPerPage;

    if (keywords) {
      const safeKeywords = escapeStringRegexp(keywords);
      const regex = new RegExp(safeKeywords, 'i');
      const keywordsQuery = {$or: []};
      keywordsQuery.$or.push({title: {$regex: regex}});
      keywordsQuery.$or.push({headline: {$regex: regex}});
      keywordsQuery.$or.push({description: {$regex: regex}});
      keywordsQuery.$or.push({searchTags: {$regex: regex}});
      keywordsQuery.$or.push({serviceCategories: {$regex: regex}});
      baseQuery.$and.push(keywordsQuery);
    }

    if (location) {
      const safeLocation = escapeStringRegexp(location);
      const regex = new RegExp(safeLocation, 'i');
      baseQuery.$and.push({location: {$regex: regex}});
    }

    const constructedQuery = {
      ...baseQuery,
    };

    if (constructedQuery.$and.length === 0) {
      delete constructedQuery.$and;
    }

    const organizations = await Organization.find(constructedQuery)
      .skip(skipCount)
      .limit(resultsPerPage)
      .exec();

    const organizationCount = await Organization.count(constructedQuery);

    if (organizations.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getOrganizationsForAdmin',
        functionParams: [
          {
            paramName: 'orgSearchParams',
            paramValue: orgSearchParams,
            paramType: typeof orgSearchParams,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'No Organizations Found',
        startLogId,
      });

      return {
        organizationData: organizations,
        response: {
          message: 'No Organizations Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getOrganizationsForAdmin',
      functionParams: [
        {
          paramName: 'orgSearchParams',
          paramValue: orgSearchParams,
          paramType: typeof orgSearchParams,
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
      organizationData: organizations,
      organizationCount,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getOrganizationsForAdmin',
      functionParams: [
        {
          paramName: 'orgSearchParams',
          paramValue: orgSearchParams,
          paramType: typeof orgSearchParams,
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
      response: {message: 'Unknown Server Error - See Logs for details', status: 500},
    };
  }
}
