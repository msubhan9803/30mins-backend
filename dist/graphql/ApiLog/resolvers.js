var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import ApiLog from '../../MongoModels/ApiLog';
import User from '../../MongoModels/User';
import jwt from 'jsonwebtoken';
import AwsSecrets from '../../utils/getAwsSecrets';
const queries = {
    getApiLogFilter: (parent, { token }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const user = yield User.findById(decodedToken.UserId, 'accountDetails.accountType').exec();
            if (user.accountDetails.accountType !== 'admin') {
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            return {
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
                types: LOG_FILTER_TYPES,
                levels: LOG_FILTER_LEVELS,
            };
        }
        catch (err) {
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    }),
    getApiLogs: (parent, { searchParams }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const { resultsPerPage, pageNumber } = searchParams;
            const apiLogs = yield ApiLog.find()
                .skip(pageNumber * resultsPerPage - resultsPerPage)
                .limit(resultsPerPage)
                .exec();
            const logsCount = yield ApiLog.count().exec();
            return {
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
                logData: apiLogs,
                logsCount,
            };
        }
        catch (err) {
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    }),
    getApiLogsForAdmin: (parent, { searchParams, token }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const user = yield User.findById(decodedToken.UserId, 'accountDetails.accountType').exec();
            if (user.accountDetails.accountType !== 'admin') {
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const { resultsPerPage, pageNumber, logType, logLevel, functionName, id } = searchParams;
            let constructedQuery = {};
            if ((logType === null || logType === void 0 ? void 0 : logType.length) !== 0 && logType) {
                constructedQuery['type'] = { $in: logType };
            }
            if ((logLevel === null || logLevel === void 0 ? void 0 : logLevel.length) !== 0 && logLevel) {
                constructedQuery['level'] = { $in: logLevel };
            }
            if (functionName) {
                constructedQuery['functionName'] = functionName;
            }
            if (id) {
                constructedQuery['$or'] = [{ startLogId: id }, { _id: id }];
            }
            const apiLogs = yield ApiLog.find(constructedQuery)
                .sort({ expireAt: -1, _id: -1 })
                .skip(pageNumber * resultsPerPage - resultsPerPage)
                .limit(resultsPerPage)
                .exec();
            const logsCount = yield ApiLog.count(constructedQuery).exec();
            return {
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
                logData: apiLogs,
                logsCount,
            };
        }
        catch (err) {
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    }),
};
const mutations = {
    createApiLog: (parent, { apiLogData }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const { type, level, message } = apiLogData;
            yield ApiLog.create({
                type,
                level,
                message,
            });
            return {
                message: 'Api Log Added Successfully',
                status: 200,
            };
        }
        catch (err) {
            return {
                message: err.message,
                status: 500,
            };
        }
    }),
    updateApiFilter: (parent, { filterConfig, token }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const user = yield User.findById(decodedToken.UserId, 'accountDetails.accountType').exec();
            if (user.accountDetails.accountType !== 'admin') {
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const { types, levels } = filterConfig;
            LOG_FILTER_TYPES = types;
            LOG_FILTER_LEVELS = levels;
            return {
                message: 'API Log Filter Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            return {
                message: err.message,
                status: 500,
            };
        }
    }),
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=resolvers.js.map