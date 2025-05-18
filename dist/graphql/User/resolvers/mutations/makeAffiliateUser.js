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
export default function makeAffiliateUser(_, { affiliateTeam, username }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'validateOtp',
                    functionParams: [
                        { paramName: 'affiliateTeam', paramValue: affiliateTeam, paramType: typeof affiliateTeam },
                        { paramName: 'username', paramValue: username, paramType: typeof username },
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
                functionName: 'makeAffiliateUser',
                functionParams: [
                    { paramName: 'affiliateTeam', paramValue: affiliateTeam, paramType: typeof affiliateTeam },
                    { paramName: 'username', paramValue: username, paramType: typeof username },
                ],
            });
            yield User.findOneAndUpdate({
                $or: [
                    { 'accountDetails.username': { $regex: new RegExp(`^${username}$`, 'i') } },
                    { 'accountDetails.email': { $regex: new RegExp(`^${username}$`, 'i') } },
                ],
            }, {
                $set: {
                    affiliateTeam: affiliateTeam,
                    isMarketer: true,
                },
            }).orFail(() => new Error('User Document Not Found'));
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'makeAffiliateUser',
                functionParams: [
                    { paramName: 'affiliateTeam', paramValue: affiliateTeam, paramType: typeof affiliateTeam },
                    { paramName: 'username', paramValue: username, paramType: typeof username },
                ],
                additionalMessage: 'User Updated Successfully',
                startLogId,
            });
            return {
                message: 'User Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateUser',
                    functionParams: [
                        { paramName: 'affiliateTeam', paramValue: affiliateTeam, paramType: typeof affiliateTeam },
                        { paramName: 'username', paramValue: username, paramType: typeof username },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            if ((err === null || err === void 0 ? void 0 : err._message) === 'User validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateUser',
                    functionParams: [
                        { paramName: 'affiliateTeam', paramValue: affiliateTeam, paramType: typeof affiliateTeam },
                        { paramName: 'username', paramValue: username, paramType: typeof username },
                    ],
                    additionalMessage: err.message,
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
                functionName: 'updateUser',
                functionParams: [
                    { paramName: 'affiliateTeam', paramValue: affiliateTeam, paramType: typeof affiliateTeam },
                    { paramName: 'username', paramValue: username, paramType: typeof username },
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
//# sourceMappingURL=makeAffiliateUser.js.map