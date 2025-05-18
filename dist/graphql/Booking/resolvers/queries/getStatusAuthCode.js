var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import StatusAuthCodeModel from '../../../../MongoModels/StatusAuthCode';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getStatusAuthCode(_, { bookingId, email, authCode }, { token }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        let query;
        if (authCode) {
            query = { authCode };
        }
        if (bookingId && email) {
            query = {
                $and: [{ email: { $eq: email } }, { bookingId: { $eq: bookingId } }],
            };
        }
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getStatusAuthCode',
                    functionParams: [
                        {
                            paramName: 'authCode',
                            paramValue: authCode,
                            paramType: typeof authCode,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    response: {
                        status: 401,
                        message: 'Not Authenticated',
                    },
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getStatusAuthCode',
                functionParams: [
                    {
                        paramName: 'authCode',
                        paramValue: authCode,
                        paramType: typeof authCode,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
            });
            const statusAuthCode = yield StatusAuthCodeModel.findOne(query);
            if (!statusAuthCode) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getStatusAuthCode',
                    functionParams: [
                        {
                            paramName: 'authCode',
                            paramValue: authCode,
                            paramType: typeof authCode,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Status Auth Code Not Found!',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Status Auth Code Not Found!',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getStatusAuthCode',
                functionParams: [
                    {
                        paramName: 'authCode',
                        paramValue: authCode,
                        paramType: typeof authCode,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                statusAuthCode,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (error) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getStatusAuthCode',
                functionParams: [
                    {
                        paramName: 'authCode',
                        paramValue: authCode,
                        paramType: typeof authCode,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
                additionalMessage: error.message,
                startLogId,
            });
            return {
                reponse: {
                    message: error.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getStatusAuthCode.js.map