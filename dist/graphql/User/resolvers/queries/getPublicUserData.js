var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import escapeStringRegexp from 'escape-string-regexp';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getPublicUserData(parent, { username }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getPublicUserData',
                functionParams: [{ paramName: 'username', paramValue: username, paramType: typeof username }],
            });
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getPublicUserData',
                    functionParams: [{ paramName: 'username', paramValue: username, paramType: typeof username }],
                    additionalMessage: 'Invalid Permissions: Invalid BACKEND_API_KEY',
                    startLogId,
                });
                return {
                    userData: null,
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const safeUsername = escapeStringRegexp(username);
            const pattern = `^${safeUsername}$`;
            const regex = new RegExp(pattern, 'i');
            const user = yield User.findOne({ 'accountDetails.username': { $regex: regex } })
                .populate('educationHistory')
                .populate('services')
                .populate('jobHistory')
                .populate('publications')
                .populate('events');
            if (!user) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getPublicUserData',
                    functionParams: [{ paramName: 'username', paramValue: username, paramType: typeof username }],
                    additionalMessage: 'User Not Found',
                    startLogId,
                });
                return {
                    userData: null,
                    response: {
                        message: 'User Not Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getPublicUserData',
                functionParams: [{ paramName: 'username', paramValue: username, paramType: typeof username }],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                userData: user,
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
                functionName: 'getPublicUserData',
                functionParams: [{ paramName: 'username', paramValue: username, paramType: typeof username }],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                userData: null,
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getPublicUserData.js.map