import Sitemap from '../../../../MongoModels/Sitemap';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';

export default async function getSitemaps() {

  let startLogId

  try {

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getSitemaps',
      functionParams: [
        {
          paramName: 'No Params',
          paramValue: "No Params",
          paramType: "No Params",
        },
      ],
    });

    const sitemapsData = await Sitemap.aggregate([
      {
        $project: {
          _id: 1,
          sitemapType: 1,
          index: 1
        }
      },
      {
        $group: {
          _id: "$sitemapType",
          "sitemaps": {
            $push: "$$ROOT",
          }
        }
      },
      { $sort: { "_id": 1 } },
    ])

    
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getSitemaps',
      functionParams: [
        {
          paramName: 'No Params',
          paramValue: "No Params",
          paramType: "No Params",
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId
    });

    return {
      groups: sitemapsData,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getSitemaps',
      functionParams: [
        {
          paramName: 'No Params',
          paramValue: "No Params",
          paramType: "No Params", 
        },
      ],
      additionalMessage: err.message,
      startLogId
    });

    return {
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
