import Charity from '../../../../MongoModels/Charity';

import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getPublicCharityById(parent, {documentId}, context, info) {
  const SECRETS = await AwsSecrets.getInstance();
  let startLogId: String;
  try {
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getPublicCharityById',
        functionParams: [
          {paramName: 'documentId', paramValue: documentId, paramType: typeof documentId},
        ],
        additionalMessage: 'Invalid Permissions: Invalid BACKEND_API_KEY',
        startLogId,
      });
      return {
        userData: null,
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getPublicCharityById',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
      ],
    });
    const charity = await Charity.findById(documentId).orFail(
      () => new Error('Document Not Found')
    );

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getPublicCharityById',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      charityData: charity,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getPublicCharityById',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      charityData: [],
      response: {message: err.message, status: 500},
    };
  }
}
