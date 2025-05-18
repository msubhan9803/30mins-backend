var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v4 as uuid } from 'uuid';
import StatusAuthCodeModel from '../../../../MongoModels/StatusAuthCode';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function addStatusAuthCode(_, { input }, { token }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addStatusAuthCode',
                    functionParams: [
                        {
                            paramName: 'StatusAuthCodeInput',
                            paramValue: input,
                            paramType: typeof input,
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
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'addStatusAuthCode',
                functionParams: [
                    {
                        paramName: 'StatusAuthCodeInput',
                        paramValue: input,
                        paramType: typeof input,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
            });
            const { availableStatus, bookingId, email, expireAt } = input;
            const statusAuthCode = new StatusAuthCodeModel({
                authCode: uuid(),
                availableStatus,
                bookingId,
                email,
                expireAt,
            });
            yield statusAuthCode.save();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'addStatusAuthCode',
                functionParams: [
                    {
                        paramName: 'StatusAuthCodeInput',
                        paramValue: input,
                        paramType: typeof input,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
                additionalMessage: 'Status Code Added Successfully!',
                startLogId,
            });
            return {
                authCode: statusAuthCode,
                response: {
                    status: 200,
                    message: 'Status Code Added Successfully!',
                },
            };
        }
        catch (error) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'addStatusAuthCode',
                functionParams: [
                    {
                        paramName: 'StatusAuthCodeInput',
                        paramValue: input,
                        paramType: typeof input,
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
                response: {
                    status: 500,
                    message: error.message,
                },
            };
        }
    });
}
//# sourceMappingURL=addStatusAuthCode.js.map