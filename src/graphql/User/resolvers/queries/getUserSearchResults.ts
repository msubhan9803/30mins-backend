import escapeStringRegexp from 'escape-string-regexp';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getUserSearchResults(parent, {userSearchParams}, context, info) {
  let startLogId: String;

  try {
    const {keywords, location, isIndividual, pageNumber, resultsPerPage} = userSearchParams;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUserSearchResults',
      functionParams: [
        {
          paramName: 'userSearchParams',
          paramValue: userSearchParams,
          paramType: typeof userSearchParams,
        },
      ],
    });

    const baseQuery = {$and: []};
    let skipCount = pageNumber * resultsPerPage - resultsPerPage;
    let userCount: number;

    if (keywords) {
      const safeKeywords = escapeStringRegexp(keywords);
      const regex = new RegExp(safeKeywords, 'i');
      const keywordsQuery = {$or: []};
      keywordsQuery.$or.push({'accountDetails.username': {$regex: regex}});
      keywordsQuery.$or.push({'accountDetails.email': {$regex: regex}});
      keywordsQuery.$or.push({'personalDetails.headline': {$regex: regex}});
      keywordsQuery.$or.push({'personalDetails.name': {$regex: regex}});
      keywordsQuery.$or.push({'personalDetails.searchTags': {$regex: regex}});
      baseQuery.$and.push(keywordsQuery);
    }

    if (isIndividual === true) {
      baseQuery.$and.push({'accountDetails.isIndividual': isIndividual});
    } else if (isIndividual === false) {
      baseQuery.$and.push({'accountDetails.isIndividual': isIndividual});
    }

    if (location) {
      const safeLocation = escapeStringRegexp(location);
      const regex = new RegExp(safeLocation, 'i');
      const locationQuery = {$or: []};
      locationQuery.$or.push({'locationDetails.country': {$regex: regex}});
      locationQuery.$or.push({'locationDetails.zipCode': {$regex: regex}});
      baseQuery.$and.push(locationQuery);
    }

    const constructedQuery = {
      ...baseQuery,
      services: {$ne: []},
      'accountDetails.privateAccount': false,
    };

    if (constructedQuery.$and.length === 0) {
      delete constructedQuery.$and;
    }

    if (!keywords && !location) {
      // If no search query is passed, skip random amount of documents
      userCount = await User.count(constructedQuery).exec();
      skipCount = Math.floor(Math.random() * userCount);
    } else {
      userCount = await User.count(constructedQuery).exec();
    }

    const users = await User.find(constructedQuery).skip(skipCount).limit(resultsPerPage).exec();

    if (users.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getUserSearchResults',
        functionParams: [
          {
            paramName: 'userSearchParams',
            paramValue: userSearchParams,
            paramType: typeof userSearchParams,
          },
        ],
        additionalMessage: 'No Users Found',
        startLogId,
      });

      return {
        userData: users,
        response: {
          message: 'No Users Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUserSearchResults',
      functionParams: [
        {
          paramName: 'userSearchParams',
          paramValue: userSearchParams,
          paramType: typeof userSearchParams,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      userData: users,
      userCount,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getUserSearchResults',
      functionParams: [
        {
          paramName: 'userSearchParams',
          paramValue: userSearchParams,
          paramType: typeof userSearchParams,
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
