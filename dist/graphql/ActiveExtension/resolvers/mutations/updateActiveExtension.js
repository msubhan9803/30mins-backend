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
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function updateActiveExtension(parent, { activeExtensionData, customerId, subscriptionId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'updateActiveExtension',
                functionParams: [
                    {
                        paramName: 'activeExtensionData',
                        paramValue: activeExtensionData,
                        paramType: typeof activeExtensionData,
                    },
                    {
                        paramName: 'customerId',
                        paramValue: customerId,
                        paramType: typeof customerId,
                    },
                    {
                        paramName: 'subscriptionId',
                        paramValue: 'subscriptionId',
                        paramType: typeof subscriptionId,
                    },
                ],
            });
            yield ActiveExtension.findOneAndUpdate({
                customerId,
                extensionsubscriptionId: subscriptionId,
            }, {
                $set: Object.assign({}, activeExtensionData),
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'updateActiveExtension',
                functionParams: [
                    {
                        paramName: 'activeExtensionData',
                        paramValue: activeExtensionData,
                        paramType: typeof activeExtensionData,
                    },
                    {
                        paramName: 'customerId',
                        paramValue: customerId,
                        paramType: typeof customerId,
                    },
                    {
                        paramName: 'subscriptionId',
                        paramValue: 'subscriptionId',
                        paramType: typeof subscriptionId,
                    },
                ],
                additionalMessage: 'Active Extension Updated Successfully',
                startLogId,
            });
            return {
                message: 'Active Extension Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'ActiveExtension validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateActiveExtension',
                    functionParams: [
                        {
                            paramName: 'activeExtensionData',
                            paramValue: activeExtensionData,
                            paramType: typeof activeExtensionData,
                        },
                        {
                            paramName: 'customerId',
                            paramValue: customerId,
                            paramType: typeof customerId,
                        },
                        {
                            paramName: 'subscriptionId',
                            paramValue: 'subscriptionId',
                            paramType: typeof subscriptionId,
                        },
                    ],
                    additionalMessage: 'Mongoose ActiveExtension Validation Failed',
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
                functionName: 'updateActiveExtension',
                functionParams: [
                    {
                        paramName: 'activeExtensionData',
                        paramValue: activeExtensionData,
                        paramType: typeof activeExtensionData,
                    },
                    {
                        paramName: 'customerId',
                        paramValue: customerId,
                        paramType: typeof customerId,
                    },
                    {
                        paramName: 'subscriptionId',
                        paramValue: 'subscriptionId',
                        paramType: typeof subscriptionId,
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
//# sourceMappingURL=updateActiveExtension.js.map