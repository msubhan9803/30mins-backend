import Organization from '../../../../MongoModels/Organization';
import escapeStringRegexp from 'escape-string-regexp';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getOrganizationBySlug(parent, {slug}, context, info) {
  let startLogId: String;
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getOrganizationBySlug',
      functionParams: [
        {
          paramName: 'slug',
          paramValue: slug,
          paramType: typeof slug,
        },
      ],
    });

    const safeSlugString = escapeStringRegexp(slug);
    const pattern = `^${safeSlugString}$`;
    const regex = new RegExp(pattern, 'i');

    const organizationResult = await Organization.findOne({
      slug: {$regex: regex},
    })
      .populate('services')
      .orFail(() => new Error('Document Not Found'))
      .exec();

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getOrganizationBySlug',
      functionParams: [
        {
          paramName: 'slug',
          paramValue: slug,
          paramType: typeof slug,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      response: {
        message: 'Query Successful',
        status: 200,
      },
      organizationData: organizationResult,
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getOrganizationBySlug',
      functionParams: [
        {
          paramName: 'slug',
          paramValue: slug,
          paramType: typeof slug,
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
