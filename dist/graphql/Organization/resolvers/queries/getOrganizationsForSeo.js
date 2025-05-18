var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Organization from '../../../../MongoModels/Organization';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getOrganizationsForSeo(parent, { resultsPerBatch, batchNumber }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        let startLogId;
        const { token } = context;
        try {
            if (token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getOrganizationsForSeo',
                    functionParams: [
                        {
                            paramName: 'resultsPerBatch',
                            paramValue: resultsPerBatch,
                            paramType: typeof resultsPerBatch,
                        },
                        {
                            paramName: 'batchNumber',
                            paramValue: batchNumber,
                            paramType: typeof batchNumber,
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
                functionName: 'getOrganizationsForSeo',
                functionParams: [
                    {
                        paramName: 'resultsPerBatch',
                        paramValue: resultsPerBatch,
                        paramType: typeof resultsPerBatch,
                    },
                    {
                        paramName: 'batchNumber',
                        paramValue: batchNumber,
                        paramType: typeof batchNumber,
                    },
                ],
            });
            const organizationData = yield Organization.find()
                .skip(resultsPerBatch * batchNumber - resultsPerBatch)
                .limit(resultsPerBatch)
                .select(['title', 'description', 'image', 'slug']);
            const organizationCount = yield Organization.count();
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationsForSeo',
                functionParams: [
                    {
                        paramName: 'resultsPerBatch',
                        paramValue: resultsPerBatch,
                        paramType: typeof resultsPerBatch,
                    },
                    {
                        paramName: 'batchNumber',
                        paramValue: batchNumber,
                        paramType: typeof batchNumber,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                organizationData,
                organizationCount,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getOrganizationsForSeo',
                functionParams: [
                    {
                        paramName: 'resultsPerBatch',
                        paramValue: resultsPerBatch,
                        paramType: typeof resultsPerBatch,
                    },
                    {
                        paramName: 'batchNumber',
                        paramValue: batchNumber,
                        paramType: typeof batchNumber,
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
    });
}
//# sourceMappingURL=getOrganizationsForSeo.js.map