import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import BlockedDomain from '../../../../MongoModels/BlockedDomain';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function addBlockedDomain(parent, {blockedDomainData}, context, info) {
  let startLogId: String;

  try {
    const SECRETS = await AwsSecrets.getInstance();

    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'addBlockedDomain',
        functionParams: [
          {
            paramName: 'blockedDomainData',
            paramValue: blockedDomainData,
            paramType: typeof blockedDomainData,
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
      functionName: 'addBlockedDomain',
      functionParams: [
        {
          paramName: 'blockedDomainData',
          paramValue: blockedDomainData,
          paramType: typeof blockedDomainData,
        },
      ],
    });

    const {domain, blockReason} = blockedDomainData;

    const createdBlockedDomain = await BlockedDomain.create({
      domain,
      blockReason,
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'addBlockedDomain',
      functionParams: [
        {
          paramName: 'blockedDomainData',
          paramValue: blockedDomainData,
          paramType: typeof blockedDomainData,
        },
      ],
      additionalMessage: 'Blocked Domain Added Successfully',
      startLogId,
    });

    return {
      message: 'Blocked Domain Added Successfully',
      status: 200,
    };
  } catch (err) {
    if (err?._message === 'BlockedDomain validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'addBlockedDomain',
        functionParams: [
          {
            paramName: 'blockedDomainData',
            paramValue: blockedDomainData,
            paramType: typeof blockedDomainData,
          },
        ],
        additionalMessage: 'Mongoose BlockedDomain Validation Failed',
        startLogId,
      });

      return {
        message: err.message,
        status: 400,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'addBlockedDomain',
      functionParams: [
        {
          paramName: 'blockedDomainData',
          paramValue: blockedDomainData,
          paramType: typeof blockedDomainData,
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
