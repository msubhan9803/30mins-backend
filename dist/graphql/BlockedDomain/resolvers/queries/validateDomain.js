var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import BlockedDomain from '../../../../MongoModels/BlockedDomain';
import dnsPromiseData from 'dns';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
const dns = dnsPromiseData.promises;
export default function validateDomain(parent, { domain }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
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
            startLogId = yield createApiLog({
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
            const domainCheckOne = yield dns.resolve(domain).catch(() => false);
            const domainCheckTwo = yield dns.resolve(`www.${domain}`).catch(() => false);
            if (!domainCheckOne && !domainCheckTwo) {
                yield createApiLog({
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
                return { message: 'Invalid Email Domain', status: 400 };
            }
            const safeDomain = escapeStringRegexp(domain);
            const domainPattern = `^${safeDomain}$`;
            const domainRegex = new RegExp(domainPattern, 'i');
            // Check if Domain is in BlockedDomains Collection
            const isBlocked = yield BlockedDomain.exists({ domain: { $regex: domainRegex } });
            if (isBlocked) {
                yield createApiLog({
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
            yield createApiLog({
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
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 'ENOTFOUND') {
                yield createApiLog({
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
                return { message: 'Invalid Email Domain', status: 400 };
            }
            yield createApiLog({
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
    });
}
//# sourceMappingURL=validateDomain.js.map