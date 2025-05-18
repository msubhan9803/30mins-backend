var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import Credential from '../../../../MongoModels/Credential';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function checkUserEmailAndCalendar(parent, { email }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        const { token } = context;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'checkUserEmailAndCalendar',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const user = yield User.findOne({
                'accountDetails.email': email,
            }, ['_id']);
            const userExists = user ? true : false;
            if (!userExists) {
                startLogId = yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkUserEmailAndCalendar',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: `The user does not exist with the provided ${email}`,
                    startLogId,
                });
                return {
                    guestID: user === null || user === void 0 ? void 0 : user._id,
                    userExists,
                    hasCalendar: false,
                    response: {
                        message: `The user does not exist with the provided ${email}`,
                        status: 200,
                    },
                };
            }
            const hasCalendar = yield Credential.exists({ userId: user._id });
            if (!hasCalendar) {
                startLogId = yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkUserEmailAndCalendar',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: `The user does not have the calendar with the provided email ${email}`,
                    startLogId,
                });
                return {
                    guestID: user === null || user === void 0 ? void 0 : user._id,
                    userExists,
                    hasCalendar,
                    response: {
                        message: `The user does not have the calendar with the provided email ${email}`,
                        status: 400,
                    },
                };
            }
            return {
                guestID: user === null || user === void 0 ? void 0 : user._id,
                userExists,
                hasCalendar,
                response: {
                    message: `The user exists and has Calendar.`,
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkUserEmailAndCalendar',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'checkUserEmailAndCalendar',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
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
//# sourceMappingURL=checkUserEmailAndCalendar.js.map