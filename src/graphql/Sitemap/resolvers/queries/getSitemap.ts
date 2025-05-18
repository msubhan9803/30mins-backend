import Sitemap from '../../../../MongoModels/Sitemap';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getSitemap(parent, {sitemapIndex, sitemapType}, context, info) {
  
  let startLogId

  try {
    
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getSitemap',
      functionParams: [
        {
          paramName: 'sitemapIndex',
          paramValue: sitemapIndex,
          paramType: typeof sitemapIndex,
        },
        {
          paramName: 'sitemapType',
          paramValue: sitemapType,
          paramType: typeof sitemapType,
        },
      ],
    });

    const sitemap = await Sitemap.findOne({
      index: sitemapIndex,
      sitemapType: sitemapType
    }).exec()

    if (!sitemap) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getSitemap',
        functionParams: [
          {
            paramName: 'sitemapIndex',
            paramValue: sitemapIndex,
            paramType: typeof sitemapIndex,
          },
          {
            paramName: 'sitemapType',
            paramValue: sitemapType,
            paramType: typeof sitemapType,
          },
        ],
        additionalMessage: 'Sitemap Not Found',
        startLogId,
      });

      return {
        response: {
          message: 'Document Not Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getSitemap',
      functionParams: [
        {
          paramName: 'sitemapIndex',
          paramValue: sitemapIndex,
          paramType: typeof sitemapIndex,
        },
        {
          paramName: 'sitemapType',
          paramValue: sitemapType,
          paramType: typeof sitemapType,
        },
      ],
      additionalMessage: 'Sitemap Query Successful',
      startLogId,
    });

    return {
      sitemap: sitemap,
      response: {
        message: 'Sitemap Query Successful',
        status: 200,
      },
    };
  } catch (err) {

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getSitemap',
      functionParams: [
        {
          paramName: 'sitemapIndex',
          paramValue: sitemapIndex,
          paramType: typeof sitemapIndex,
        },
        {
          paramName: 'sitemapType',
          paramValue: sitemapType,
          paramType: typeof sitemapType,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
