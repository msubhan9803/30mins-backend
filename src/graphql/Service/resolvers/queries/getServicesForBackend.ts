import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import Service from '../../../../MongoModels/Service';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

export default async function getServicesForBackend(parent, {serviceSearchParams}, context, info) {
  let startLogId: String;
  try {
    const {keywords} = serviceSearchParams;

    const SECRETS = await AwsSecrets.getInstance();
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'backendUpdateUser',
        functionParams: [
          {
            paramName: 'serviceSearchParams',
            paramValue: serviceSearchParams,
            paramType: typeof serviceSearchParams,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getServicesForBackend',
      functionParams: [
        {
          paramName: 'serviceSearchParams',
          paramValue: serviceSearchParams,
          paramType: typeof serviceSearchParams,
        },
      ],
    });

    let serviceBaseQuery = {};
    let serviceKeywordsQuery = [];
    const safeKeywords = escapeStringRegexp(keywords);
    const regex = new RegExp(safeKeywords, 'i');

    if (keywords) {
      serviceKeywordsQuery.push({title: {$regex: regex}});
      serviceKeywordsQuery.push({description: {$regex: regex}});
      serviceKeywordsQuery.push({slug: {$regex: regex}});
      serviceKeywordsQuery.push({currency: {$regex: regex}});

      const users = await User.find({'accountDetails.email': {$regex: regex}});
      const userIDs = users.map(user => user._id);
      if (userIDs.length !== 0) {
        serviceKeywordsQuery.push({userId: {$in: userIDs}});
      }

      if (parseInt(keywords)) {
        serviceKeywordsQuery.push({duration: parseInt(keywords)});
      }
      serviceBaseQuery['$or'] = serviceKeywordsQuery;
    }

    const services = await Service.find(serviceBaseQuery).populate('userId', [
      'accountDetails.username',
      'personalDetails.name',
      'accountDetails.email',
    ]);

    let serviceCount = await Service.count(serviceBaseQuery);

    if (services.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getServicesForBackend',
        functionParams: [
          {
            paramName: 'serviceSearchParams',
            paramValue: serviceSearchParams,
            paramType: typeof serviceSearchParams,
          },
        ],
        additionalMessage: 'No Services Found',
        startLogId,
      });

      return {
        serviceData: services,
        serviceCount,
        response: {
          message: 'No Services Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getServicesForBackend',
      functionParams: [
        {
          paramName: 'serviceSearchParams',
          paramValue: serviceSearchParams,
          paramType: typeof serviceSearchParams,
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
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getServicesForBackend',
      functionParams: [
        {
          paramName: 'serviceSearchParams',
          paramValue: serviceSearchParams,
          paramType: typeof serviceSearchParams,
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
