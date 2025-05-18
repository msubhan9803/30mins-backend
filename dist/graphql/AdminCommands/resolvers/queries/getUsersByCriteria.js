var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getUsersByCriteria(parent, { userSearchParams }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        const { importedBatch, welcomeComplete, verifiedEmail } = userSearchParams;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getUsersByCriteria',
                    functionParams: [
                        {
                            paramName: 'importedBatch',
                            paramValue: importedBatch,
                            paramType: typeof importedBatch,
                        },
                        {
                            paramName: 'welcomeComplete',
                            paramValue: 'welcomeComplete',
                            paramType: typeof welcomeComplete,
                        },
                        {
                            paramName: 'verifiedEmail',
                            paramValue: 'verifiedEmail',
                            paramType: typeof verifiedEmail,
                        },
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
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getUsersByCriteria',
                functionParams: [
                    {
                        paramName: 'importedBatch',
                        paramValue: importedBatch,
                        paramType: typeof importedBatch,
                    },
                    {
                        paramName: 'welcomeComplete',
                        paramValue: 'welcomeComplete',
                        paramType: typeof welcomeComplete,
                    },
                    {
                        paramName: 'verifiedEmail',
                        paramValue: 'verifiedEmail',
                        paramType: typeof verifiedEmail,
                    },
                ],
            });
            const users = yield User.find({
                importedBatch: importedBatch,
                welcomeComplete: welcomeComplete,
                'accountDetails.verifiedEmail': verifiedEmail,
            });
            if (users.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getUsersByCriteria',
                    functionParams: [
                        {
                            paramName: 'importedBatch',
                            paramValue: importedBatch,
                            paramType: typeof importedBatch,
                        },
                        {
                            paramName: 'welcomeComplete',
                            paramValue: 'welcomeComplete',
                            paramType: typeof welcomeComplete,
                        },
                        {
                            paramName: 'verifiedEmail',
                            paramValue: 'verifiedEmail',
                            paramType: typeof verifiedEmail,
                        },
                    ],
                    additionalMessage: 'No Users Found',
                    startLogId,
                });
                return {
                    userData: users,
                    userCount: users.length,
                    response: {
                        message: 'No Users Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getUsersByCriteria',
                functionParams: [
                    {
                        paramName: 'importedBatch',
                        paramValue: importedBatch,
                        paramType: typeof importedBatch,
                    },
                    {
                        paramName: 'welcomeComplete',
                        paramValue: 'welcomeComplete',
                        paramType: typeof welcomeComplete,
                    },
                    {
                        paramName: 'verifiedEmail',
                        paramValue: 'verifiedEmail',
                        paramType: typeof verifiedEmail,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                userData: users,
                userCount: users.length,
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
                functionName: 'getUsersByCriteria',
                functionParams: [
                    {
                        paramName: 'importedBatch',
                        paramValue: importedBatch,
                        paramType: typeof importedBatch,
                    },
                    {
                        paramName: 'welcomeComplete',
                        paramValue: 'welcomeComplete',
                        paramType: typeof welcomeComplete,
                    },
                    {
                        paramName: 'verifiedEmail',
                        paramValue: 'verifiedEmail',
                        paramType: typeof verifiedEmail,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=getUsersByCriteria.js.map