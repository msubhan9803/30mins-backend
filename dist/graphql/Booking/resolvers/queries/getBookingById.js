var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
export default function getBookingById(parent, { token, documentId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            let decodedToken = { UserId: undefined };
            if (token) {
                decodedToken = jwt.verify(token, accessTokenSecret);
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getBookingById',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            let query = {
                _id: documentId,
            };
            if (decodedToken.UserId && token) {
                const isAdmin = yield User.exists({
                    _id: decodedToken.UserId,
                    'accountDetails.accountType': 'admin',
                });
                if (!isAdmin) {
                    query = {
                        _id: documentId,
                        $or: [{ provider: decodedToken.UserId }, { booker: decodedToken.UserId }],
                    };
                    yield createApiLog({
                        type: ApiLogTypes.QUERY_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'getBookingsForAdmin',
                        functionParams: [
                            {
                                paramName: 'getBookingById',
                                paramValue: documentId,
                                paramType: typeof documentId,
                            },
                            {
                                paramName: 'token',
                                paramValue: 'HIDDEN_TOKEN',
                                paramType: typeof token,
                            },
                            {
                                paramName: 'userId',
                                paramValue: decodedToken.UserId,
                                paramType: typeof decodedToken.UserId,
                            },
                        ],
                        additionalMessage: 'Not Authenticated as Admin Continues the Flow of GetBookingById',
                        startLogId,
                    });
                }
            }
            const booking = yield BookedMeeting.findOne(query)
                .orFail(() => new Error('Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getBookingById',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                bookingData: booking,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getBookingById',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getBookingById',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
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
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=getBookingById.js.map