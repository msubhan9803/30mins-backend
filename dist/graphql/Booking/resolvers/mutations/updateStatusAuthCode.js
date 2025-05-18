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
export default function updateStatusAuthCode(_, { id }, { token }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateStatusAuthCode',
                    functionParams: [
                        {
                            paramName: 'id',
                            paramValue: id,
                            paramType: typeof id,
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
                    status: 401,
                    message: 'Not Authenticated',
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'bookMeeting',
                functionParams: [
                    {
                        paramName: 'updateStatusAuthCode',
                        paramValue: id,
                        paramType: typeof id,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
            });
            yield StatusAuthCodeModel.findByIdAndUpdate(id, { used: true });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'updateStatusAuthCode',
                functionParams: [
                    {
                        paramName: 'id',
                        paramValue: id,
                        paramType: typeof id,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
                additionalMessage: 'Status Code Updated Successfully!',
                startLogId,
            });
            return {
                status: 200,
                message: 'Status Code Updated Successfully!',
            };
        }
        catch (error) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'updateStatusAuthCode',
                functionParams: [
                    {
                        paramName: 'id',
                        paramValue: id,
                        paramType: typeof id,
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
                status: 500,
                message: error.message,
            };
        }
    });
}
//# sourceMappingURL=updateStatusAuthCode.js.map