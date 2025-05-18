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
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
export default function deleteUsersByCriteria(parent, { criteria }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        const { importedBatch, welcomeComplete, verifiedEmail } = criteria;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteUsersByCriteria',
                    functionParams: [
                        { paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch },
                        {
                            paramName: 'welcomeComplete',
                            paramValue: welcomeComplete,
                            paramType: typeof welcomeComplete,
                        },
                        { paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'deleteUsersByCriteria',
                functionParams: [
                    { paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch },
                    {
                        paramName: 'welcomeComplete',
                        paramValue: welcomeComplete,
                        paramType: typeof welcomeComplete,
                    },
                    { paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail },
                ],
            });
            if (!importedBatch) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteUsersByCriteria',
                    functionParams: [
                        { paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch },
                        {
                            paramName: 'welcomeComplete',
                            paramValue: welcomeComplete,
                            paramType: typeof welcomeComplete,
                        },
                        { paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail },
                    ],
                    additionalMessage: 'Invalid Argument: Imported Batch must be passed',
                });
                return {
                    response: {
                        message: 'Invalid Argument: Imported Batch must be passed',
                        status: 400,
                    },
                };
            }
            const deletedUsers = yield User.count({
                importedBatch,
                welcomeComplete,
                'accountDetails.verifiedEmail': verifiedEmail,
            });
            yield User.deleteMany({
                importedBatch,
                welcomeComplete,
                'accountDetails.verifiedEmail': verifiedEmail,
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'deleteUsersByCriteria',
                functionParams: [
                    { paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch },
                    {
                        paramName: 'welcomeComplete',
                        paramValue: welcomeComplete,
                        paramType: typeof welcomeComplete,
                    },
                    { paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail },
                ],
                additionalMessage: 'Users Deleted',
                startLogId,
            });
            return {
                deletedCount: deletedUsers,
                response: {
                    message: 'Users Deleted',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'deleteUsersByCriteria',
                functionParams: [
                    { paramName: 'importedBatch', paramValue: importedBatch, paramType: typeof importedBatch },
                    {
                        paramName: 'welcomeComplete',
                        paramValue: welcomeComplete,
                        paramType: typeof welcomeComplete,
                    },
                    { paramName: 'verifiedEmail', paramValue: verifiedEmail, paramType: typeof verifiedEmail },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: {
                    message: 'Unknown Error',
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=deleteUsersByCriteria.js.map