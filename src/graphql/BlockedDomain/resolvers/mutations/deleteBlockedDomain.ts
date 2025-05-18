import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import BlockedDomain from '../../../../MongoModels/BlockedDomain';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function deleteBlockedDomain(parent, {domain}, context, info) {
  let startLogId: String;

  try {
    const SECRETS = await AwsSecrets.getInstance();
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteBlockedDomain',
        functionParams: [
          {
            paramName: 'domain',
            paramValue: domain,
            paramType: typeof domain,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'deleteBlockedDomain',
      functionParams: [
        {
          paramName: 'domain',
          paramValue: domain,
          paramType: typeof domain,
        },
      ],
    });

    const deletedBlockedDomain = await BlockedDomain.findOneAndDelete(domain);

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'deleteBlockedDomain',
      functionParams: [
        {
          paramName: 'domain',
          paramValue: domain,
          paramType: typeof domain,
        },
      ],
      additionalMessage: 'Blocked Domain Deleted Successfully',
      startLogId,
    });

    return {
      message: 'Blocked Domain Deleted Successfully',
      status: 200,
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'deleteBlockedDomain',
      functionParams: [
        {
          paramName: 'domain',
          paramValue: domain,
          paramType: typeof domain,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
