import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import BlockedDomain from '../../../../MongoModels/BlockedDomain';
import dnsPromiseData from 'dns';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
const dns = dnsPromiseData.promises;

export default async function validateDomain(parent, {domain}, context, info) {
  let startLogId: String;
  try {
    const SECRETS = await AwsSecrets.getInstance();

    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'validateDomain',
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
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'validateDomain',
      functionParams: [
        {
          paramName: 'domain',
          paramValue: domain,
          paramType: typeof domain,
        },
      ],
    });

    // Check if Domain is active
    const domainCheckOne = await dns.resolve(domain).catch(() => false);
    const domainCheckTwo = await dns.resolve(`www.${domain}`).catch(() => false);

    if (!domainCheckOne && !domainCheckTwo) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'validateDomain',
        functionParams: [
          {
            paramName: 'domain',
            paramValue: domain,
            paramType: typeof domain,
          },
        ],
        additionalMessage: 'Invalid Email Domain',
        startLogId,
      });
      return {message: 'Invalid Email Domain', status: 400};
    }

    const safeDomain = escapeStringRegexp(domain);
    const domainPattern = `^${safeDomain}$`;
    const domainRegex = new RegExp(domainPattern, 'i');
    // Check if Domain is in BlockedDomains Collection
    const isBlocked = await BlockedDomain.exists({domain: {$regex: domainRegex}});

    if (isBlocked) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'validateDomain',
        functionParams: [
          {
            paramName: 'domain',
            paramValue: domain,
            paramType: typeof domain,
          },
        ],
        additionalMessage: 'Blocked Email Domain',
        startLogId,
      });

      return {
        message: 'Blocked Email Domain',
        status: 400,
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'validateDomain',
      functionParams: [
        {
          paramName: 'domain',
          paramValue: domain,
          paramType: typeof domain,
        },
      ],
      additionalMessage: 'Allowed Email Domain',
      startLogId,
    });

    return {
      message: 'Allowed Email Domain',
      status: 200,
    };
  } catch (err) {
    if (err?.code === 'ENOTFOUND') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'validateDomain',
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
      return {message: 'Invalid Email Domain', status: 400};
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'validateDomain',
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
