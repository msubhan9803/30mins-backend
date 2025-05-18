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
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getUsersWithAdvertisingExtension(parent, params, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getUsersWithAdvertisingExtension',
                    functionParams: [{ paramName: null, paramValue: null, paramType: typeof null }],
                    additionalMessage: 'Invalid Permissions: Invalid BACKEND_API_KEY',
                });
                return {
                    userData: null,
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const filter = {
                'accountDetails.activeExtensions': {
                    $elemMatch: { $eq: stripeProductIDs.EXTENSIONS.ADVERTISEMENT },
                },
            };
            const userCount = yield User.count(filter).exec();
            let skipCount = Math.floor(Math.random() * userCount);
            if (userCount - skipCount < 2) {
                skipCount = skipCount - 2 < 0 ? 0 : skipCount - 2;
            }
            const filteredUsers = yield User.find(filter).skip(skipCount).limit(2).exec();
            return {
                userData: filteredUsers,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
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
//# sourceMappingURL=getUsersWithAdvertisingExtension.js.map