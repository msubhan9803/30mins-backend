import Organization from '../../../../MongoModels/Organization';
import escapeStringRegexp from 'escape-string-regexp';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getOrganizationsByTitle(parent, {title}, context, info) {
  let startLogId: String;
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getOrganizationsByTitle',
      functionParams: [
        {
          paramName: 'title',
          paramValue: title,
          paramType: typeof title,
        },
      ],
    });

    const safeTitleString = escapeStringRegexp(title);
    const regex = new RegExp(safeTitleString, 'i');

    const organizationResults = await Organization.find({
      title: {$regex: regex},
    })
      .orFail(() => new Error('Document Not Found'))
      .exec();

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getOrganizationsByTitle',
      functionParams: [
        {
          paramName: 'title',
          paramValue: title,
          paramType: typeof title,
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
      organizationData: organizationResults,
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getOrganizationsByTitle',
      functionParams: [
        {
          paramName: 'title',
          paramValue: title,
          paramType: typeof title,
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
