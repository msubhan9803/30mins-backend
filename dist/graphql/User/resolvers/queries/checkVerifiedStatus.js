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
export default function checkVerifiedStatus(parent, { email }, context, info) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'checkVerifiedStatus',
                functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
            });
            email = email.trim().toLowerCase();
            const user = yield User.findOne({ 'accountDetails.email': email }, [
                'accountDetails.verifiedAccount',
            ]);
            if (((_a = user === null || user === void 0 ? void 0 : user.accountDetails) === null || _a === void 0 ? void 0 : _a.verifiedAccount) !== true) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkVerifiedStatus',
                    functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
                    additionalMessage: 'Account Not Verified!',
                    startLogId,
                });
                return {
                    message: 'Account Not Verified!',
                    status: 200,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'checkVerifiedStatus',
                functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
                additionalMessage: 'Account  Verified!',
                startLogId,
            });
            return {
                message: 'Account Verified!',
                status: 200,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'checkVerifiedStatus',
                functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
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
//# sourceMappingURL=checkVerifiedStatus.js.map