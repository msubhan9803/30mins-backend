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
export default function getlastWarningSent(_, { email }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const user = yield User.findOne({ 'accountDetails.email': email })
                .orFail(() => new Error('Document Not Found'))
                .exec();
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getlastWarningSent',
                functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
            });
            if (!user) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getlastWarningSent',
                    functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
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
                functionName: 'getlastWarningSent',
                functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            if (!(user === null || user === void 0 ? void 0 : user.lastWarningSent)) {
                yield User.findOneAndUpdate({ 'accountDetails.email': email }, {
                    lastWarningSent: Date(),
                });
                return {
                    sendEmail: true,
                    response: {
                        message: 'Query Successful',
                        status: 200,
                    },
                };
            }
            const date1 = new Date(user === null || user === void 0 ? void 0 : user.lastWarningSent);
            const date2 = new Date();
            const diffTime = Math.abs(date2.getTime() - date1.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
                yield User.findOneAndUpdate({ 'accountDetails.email': email }, {
                    lastWarningSent: Date(),
                });
                return {
                    sendEmail: true,
                    response: {
                        message: 'Query Successful',
                        status: 200,
                    },
                };
            }
            return {
                sendEmail: false,
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
                    functionName: 'getlastWarningSent',
                    functionParams: [{ paramName: 'email', paramValue: email, paramType: typeof email }],
                    additionalMessage: 'Document Not Found',
                    startLogId,
                });
                return {
                    sendEmail: false,
                    response: {
                        message: 'Document Not Found',
                        status: 401,
                    },
                };
            }
            return {
                sendEmail: false,
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getlastWarningSent.js.map