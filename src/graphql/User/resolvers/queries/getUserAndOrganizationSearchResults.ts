import escapeStringRegexp from 'escape-string-regexp';
import { EVENT_STATUS_TYPES } from '../../../../constants/enums';
import Event from '../../../../MongoModels/Event';
import Organization from '../../../../MongoModels/Organization';
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getUserAndOrganizationSearchResults(_, {searchParams}) {
  let startLogId: String;

  try {
    const {keywords, location, pageNumber, orgs, usrs, srvs, events} = searchParams;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUserAndOrganizationSearchResults',
      functionParams: [
        {
          paramName: 'searchParams',
          paramValue: searchParams,
          paramType: typeof searchParams,
        },
      ],
    });

    const userBaseQuery = {$and: []};

    const orgBaseQuery = {$and: []};

    const serBaseQuery = {$and: []};

    const eventsBaseQuery = {$and: []};

    if (keywords) {
      const safeKeywords = escapeStringRegexp(keywords);
      const splitKeywords = safeKeywords.split(' ');
      const constructedKeywords = splitKeywords.map(keyword => `(?=.*${keyword})`);
      const constructedRegex = `^${constructedKeywords.join('')}.*$`;

      const regex = new RegExp(constructedRegex, 'gmi');
      const userKeywordsQuery = {$or: []};
      const orgKeywordsQuery = {$or: []};
      const serKeywordsQuery = {$or: []};
      const eventsKeywordsQuery = {$or: []};

      userKeywordsQuery.$or.push({'accountDetails.username': {$regex: regex}});
      userKeywordsQuery.$or.push({'accountDetails.email': {$regex: regex}});
      userKeywordsQuery.$or.push({'personalDetails.headline': {$regex: regex}});
      userKeywordsQuery.$or.push({'personalDetails.name': {$regex: regex}});
      userKeywordsQuery.$or.push({'personalDetails.searchTags': {$regex: regex}});
      userBaseQuery.$and.push(userKeywordsQuery);

      orgKeywordsQuery.$or.push({title: {$regex: regex}});
      orgKeywordsQuery.$or.push({headline: {$regex: regex}});
      orgKeywordsQuery.$or.push({description: {$regex: regex}});
      orgKeywordsQuery.$or.push({searchTags: {$regex: regex}});
      orgKeywordsQuery.$or.push({serviceCategories: {$regex: regex}});
      orgBaseQuery.$and.push(orgKeywordsQuery);

      serKeywordsQuery.$or.push({title: {$regex: regex}});
      serKeywordsQuery.$or.push({slug: {$regex: regex}});
      if (parseInt(keywords, 10)) {
        serKeywordsQuery.$or.push({duration: parseInt(keywords, 10)});
      }
      serKeywordsQuery.$or.push({searchTags: {$regex: regex}});
      serKeywordsQuery.$or.push({serviceType: {$regex: regex}});
      serBaseQuery.$and.push(serKeywordsQuery);

      eventsKeywordsQuery.$or.push({title: {$regex: regex}});
      eventsKeywordsQuery.$or.push({slug: {$regex: regex}});
      if (parseInt(keywords, 10)) {
        eventsKeywordsQuery.$or.push({duration: parseInt(keywords, 10)});
      }
      eventsKeywordsQuery.$or.push({searchTags: {$regex: regex}});
      eventsKeywordsQuery.$or.push({serviceType: {$regex: regex}});
      eventsBaseQuery.$and.push(eventsKeywordsQuery);
    }

    if (location) {
      const safeLocation = escapeStringRegexp(location);
      const regex = new RegExp(safeLocation, 'i');
      const locationQuery = {$or: []};
      locationQuery.$or.push({'locationDetails.country': {$regex: regex}});
      locationQuery.$or.push({'locationDetails.zipCode': {$regex: regex}});
      userBaseQuery.$and.push(locationQuery);

      orgBaseQuery.$and.push({location: {$regex: regex}});
    }

    const userConstructedQuery = {
      ...userBaseQuery,
      services: {$ne: []},
      'accountDetails.privateAccount': false,
    };

    const orgConstructedQuery = {
      ...orgBaseQuery,
      isPrivate: false,
    };
    const serConstructedQuery = {
      ...serBaseQuery,
      isPrivate: false,
    };
    const eventsConstructedQuery = {
      eventStatus: {$ne: EVENT_STATUS_TYPES.CANCELLED},
      ...eventsBaseQuery,
    };

    if (userConstructedQuery.$and.length === 0) {
      delete userConstructedQuery.$and;
    }

    if (orgConstructedQuery.$and.length === 0) {
      delete orgConstructedQuery.$and;
    }

    if (serConstructedQuery.$and.length === 0) {
      delete serConstructedQuery.$and;
    }

    if (eventsConstructedQuery.$and.length === 0) {
      delete eventsConstructedQuery.$and;
    }

    const userCount = await User.count(userConstructedQuery);
    const organizationCount = await Organization.count(orgConstructedQuery);
    const serviceCount = await Service.count(serConstructedQuery);
    const eventsCount = await Event.count(eventsConstructedQuery);

    let usrsLimit = 6;
    let srvsLimit = 3;
    let orgsLimit = 3;
    let eventsLimit = 3;

    if (usrs && srvs && orgs && events) {
      usrsLimit = 6;
      srvsLimit = 3;
      orgsLimit = 3;
      eventsLimit = 3;
    }

    if (!usrs && !srvs && !orgs && !events) {
      usrsLimit = 0;
      srvsLimit = 0;
      orgsLimit = 0;
      eventsLimit = 0;
    }

    if (usrs && !srvs && !orgs && !events) {
      usrsLimit = 12;
      srvsLimit = 0;
      orgsLimit = 0;
      eventsLimit = 0;
    }
    if (!usrs && srvs && !orgs && !events) {
      srvsLimit = 12;
      orgsLimit = 0;
      usrsLimit = 0;
      eventsLimit = 0;
    }
    if (!usrs && !srvs && orgs && !events) {
      orgsLimit = 12;
      usrsLimit = 0;
      srvsLimit = 0;
      eventsLimit = 0;
    }
    if (!usrs && !srvs && !orgs && events) {
      orgsLimit = 0;
      usrsLimit = 0;
      srvsLimit = 0;
      eventsLimit = 12;
    }

    if (usrs && srvs && !orgs && !events) {
      usrsLimit = 6;
      srvsLimit = 6;
      orgsLimit = 0;
      eventsLimit = 0;
    }
    if (usrs && !srvs && orgs && !events) {
      usrsLimit = 6;
      orgsLimit = 6;
      srvsLimit = 0;
      eventsLimit = 0;
    }
    if (usrs && !srvs && !orgs && events) {
      usrsLimit = 6;
      orgsLimit = 0;
      srvsLimit = 0;
      eventsLimit = 6;
    }
    if (!usrs && srvs && orgs && !events) {
      srvsLimit = 6;
      orgsLimit = 6;
      usrsLimit = 0;
      eventsLimit = 0;
    }
    if (!usrs && srvs && !orgs && events) {
      srvsLimit = 6;
      orgsLimit = 0;
      usrsLimit = 0;
      eventsLimit = 6;
    }
    if (!usrs && !srvs && orgs && events) {
      srvsLimit = 0;
      orgsLimit = 6;
      usrsLimit = 0;
      eventsLimit = 6;
    }

    const userSkipCount = pageNumber * usrsLimit - usrsLimit;
    const serSkipCount = pageNumber * srvsLimit - srvsLimit;
    const orgSkipCount = pageNumber * orgsLimit - orgsLimit;
    const eventsSkipCount = pageNumber * eventsLimit - eventsLimit;

    let organizations = null;
    if (orgsLimit > 0) {
      if (!orgConstructedQuery.$and) {
        organizations = await Organization.aggregate([
          {$match: {isPrivate: false}},
          {$sample: {size: orgsLimit}},
        ]);
      } else {
        organizations = await Organization.find(orgConstructedQuery)
          .skip(orgSkipCount)
          .limit(orgsLimit);
      }
    }

    let services = null;
    if (srvsLimit > 0) {
      if (!serConstructedQuery.$and) {
        services = await Service.aggregate([
          {$match: {isPrivate: false}},
          {$sample: {size: srvsLimit}},
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userId',
            },
          },
          {$unwind: {path: '$userId', preserveNullAndEmptyArrays: true}},
          {
            $lookup: {
              from: 'organizations',
              localField: 'organizationId',
              foreignField: '_id',
              as: 'organizationId',
            },
          },
          {$unwind: {path: '$organizationId', preserveNullAndEmptyArrays: true}},
        ]);
      } else {
        services = await Service.find(serConstructedQuery)
          .skip(serSkipCount)
          .limit(srvsLimit)
          .populate('userId', [
            'accountDetails.username',
            'accountDetails.email',
            'accountDetails.avatar',
            'personalDetails.name',
            'personalDetails.headline',
          ])
          .populate('organizationId');
      }
    }

    let users = null;
    if (usrsLimit > 0) {
      if (!userConstructedQuery.$and) {
        users = await User.aggregate([
          {
            $match: {
              services: {$ne: []},
              'accountDetails.privateAccount': false,
            },
          },
          {$sample: {size: usrsLimit}},
        ]);
      } else {
        users = await User.find(userConstructedQuery).skip(userSkipCount).limit(usrsLimit);
      }
    }

    let eventsList = null;
    if (eventsLimit > 0) {
      if (!eventsConstructedQuery.$and) {
        eventsList = await Event.aggregate([
          {$match: {isPublic: true}},
          {$match: {eventStatus: {$ne: EVENT_STATUS_TYPES.CANCELLED}}},
          {$sample: {size: eventsLimit}},
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userId',
            },
          },
          {$unwind: {path: '$userId', preserveNullAndEmptyArrays: true}},
        ]);
      } else {
        eventsList = await Event.find(eventsConstructedQuery)
          .populate('userId')
          .skip(eventsSkipCount)
          .limit(eventsLimit);
      }
    }

    if (
      users &&
      users.length === 0 &&
      organizations &&
      organizations.length === 0 &&
      services &&
      services.length === 0 &&
      eventsList &&
      eventsList.length === 0
    ) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getUserAndOrganizationSearchResults',
        functionParams: [
          {
            paramName: 'searchParams',
            paramValue: searchParams,
            paramType: typeof searchParams,
          },
        ],
        additionalMessage: 'No Results Found',
        startLogId,
      });

      return {
        userData: users,
        userCount,
        organizationData: organizations,
        organizationCount,
        response: {
          message: 'No Results Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUserAndOrganizationSearchResults',
      functionParams: [
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
      userData: users,
      userCount,
      organizationData: organizations,
      organizationCount,
      serviceData: services,
      serviceCount,
      eventData: eventsList,
      eventsCount,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getUserAndOrganizationSearchResults',
      functionParams: [
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
