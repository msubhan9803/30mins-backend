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
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function addBlockedDomain(parent, { blockedDomainData }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
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
            startLogId = yield createApiLog({
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
            const { domain, blockReason } = blockedDomainData;
            const createdBlockedDomain = yield BlockedDomain.create({
                domain,
                blockReason,
            });
            yield createApiLog({
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
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'BlockedDomain validation failed') {
                yield createApiLog({
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
            yield createApiLog({
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
    });
}
//# sourceMappingURL=addBlockedDomain.js.map