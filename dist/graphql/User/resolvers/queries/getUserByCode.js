var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import PendingInvite from '../../../../MongoModels/PendingInvite';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import decryptObject from '../../../../utils/encryption/decryptObject';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getUserByCode(parent, { code }, context, info) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getUserByCode',
                    functionParams: [
                        {
                            paramName: 'code',
                            paramValue: code,
                            paramType: typeof code,
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
                functionName: 'getUserByCode',
                functionParams: [{ paramName: 'code', paramValue: code, paramType: typeof code }],
            });
            const userObject = yield User.findOne({ couponCode: code }, ['accountDetails.email']).exec();
            let invite;
            let hasAccount = true;
            if (!userObject) {
                invite = yield PendingInvite.findOne({ couponCode: code }).exec();
                hasAccount = false;
            }
            if (!userObject && !invite) {
                throw new Error('Document Not Found');
            }
            const user = yield decryptObject(userObject);
            const userEmail = ((_a = user === null || user === void 0 ? void 0 : user.accountDetails) === null || _a === void 0 ? void 0 : _a.email)
                ? (_b = user === null || user === void 0 ? void 0 : user.accountDetails) === null || _b === void 0 ? void 0 : _b.email
                : invite === null || invite === void 0 ? void 0 : invite.inviteeEmail;
            const emailDomain = userEmail.split('@')[1];
            const rangeMin = 8;
            const rangeMax = 16;
            const hiddenVal = '*'.repeat(Math.floor(Math.random() * (rangeMax - rangeMin) + rangeMin));
            const emailHint = `${userEmail[0]}${hiddenVal}@${emailDomain}`;
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getUserByCode',
                functionParams: [{ paramName: 'code', paramValue: code, paramType: typeof code }],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                emailHint,
                hasAccount,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.message === 'Document Not Found') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getUserByCode',
                    functionParams: [{ paramName: 'code', paramValue: code, paramType: typeof code }],
                    additionalMessage: err.message,
                    startLogId,
                });
                return {
                    response: {
                        message: err.message,
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getUserByCode',
                functionParams: [{ paramName: 'code', paramValue: code, paramType: typeof code }],
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
//# sourceMappingURL=getUserByCode.js.map