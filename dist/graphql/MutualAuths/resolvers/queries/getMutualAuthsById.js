var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import MutualAuths from '../../../../MongoModels/MutualAuths';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, consistent-return
export default function getMutualAuthsById(_, { token }, __, ___) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const UserId = yield User.exists({ _id: decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.UserId });
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getMutualAuthsById',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
            });
            if (!UserId) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getMutualAuthsById',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'User Document Not Found',
                    startLogId,
                });
                return {
                    response: {
                        message: `User_Not_Found`,
                        status: 200,
                    },
                };
            }
            const data = yield MutualAuths.findById(decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.UserId);
            yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getMutualAuthsById',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.UserId,
                        paramType: typeof (decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.UserId),
                    },
                ],
            });
            return {
                response: {
                    message: `Query Successful`,
                    status: 200,
                },
                Data: data,
            };
        }
        catch (err) {
            switch (err.name) {
                case 'JsonWebTokenError':
                    yield createApiLog({
                        type: ApiLogTypes.QUERY_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'getMutualAuthsById',
                        functionParams: [
                            {
                                paramName: 'token',
                                paramValue: 'HIDDEN_TOKEN',
                                paramType: typeof token,
                            },
                        ],
                        additionalMessage: 'User Document Not Found',
                        startLogId,
                    });
                    return {
                        response: {
                            message: 'invalid_token',
                            status: 500,
                        },
                        MData: [],
                    };
                default:
                    if (err.message.startsWith('Unexpected token')) {
                        yield createApiLog({
                            type: ApiLogTypes.QUERY_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'getMutualAuthsById',
                            functionParams: [
                                {
                                    paramName: 'token',
                                    paramValue: 'HIDDEN_TOKEN',
                                    paramType: typeof token,
                                },
                            ],
                            additionalMessage: 'User Document Not Found',
                            startLogId,
                        });
                        return {
                            response: {
                                message: 'invalid_token',
                                status: 500,
                            },
                            MData: [],
                        };
                    }
                    yield createApiLog({
                        type: ApiLogTypes.QUERY_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'getMutualAuthsById',
                        functionParams: [
                            {
                                paramName: 'token',
                                paramValue: 'HIDDEN_TOKEN',
                                paramType: typeof token,
                            },
                        ],
                        additionalMessage: err.message,
                        startLogId,
                    });
                    return {
                        response: {
                            message: 'server_err',
                            status: 500,
                        },
                        MData: [],
                    };
            }
        }
    });
}
//# sourceMappingURL=getMutualAuthsById.js.map