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
import User from '../../../MongoModels/User';
import Credential from '../../../MongoModels/Credential';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../utils/createApiLog';
import encryptObject from '../../../utils/encryption/encryptObject';
import fieldsToEncrypt from '../../../constants/fieldsToEncrypt';
import AwsSecrets from '../../../utils/getAwsSecrets';
import encrypt from '../../../utils/encryption/encrypt';
const queries = {};
const mutations = {
    addGoogleCalendar: (parent, { credentials, email }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(context.token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'addGoogleCalendar',
                functionParams: [
                    {
                        paramName: 'credentials',
                        paramValue: 'HIDDEN_CREDENTIALS',
                        paramType: typeof credentials,
                    },
                    {
                        paramName: 'email',
                        paramValue: 'email',
                        paramType: typeof email,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const { UserId } = decodedToken;
            const existingGoogleCalendar = yield Credential.find({
                userEmail: email,
                type: 'googlecalendar',
            });
            if (existingGoogleCalendar.length === 5) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addGoogleCalendar',
                    functionParams: [
                        {
                            paramName: 'credentials',
                            paramValue: 'HIDDEN_CREDENTIALS',
                            paramType: typeof credentials,
                        },
                        {
                            paramName: 'email',
                            paramValue: 'email',
                            paramType: typeof email,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'This calendar has exceeded the connection limit of 5, please remove from your other accounts and try again',
                    startLogId,
                });
                return {
                    message: 'This calendar has exceeded the connection limit of 5, please remove from your other accounts and try again',
                    status: 410,
                };
            }
            const dupeIntegration = yield Credential.exists({
                userId: UserId,
                userEmail: email,
                type: 'googlecalendar',
            });
            if (dupeIntegration) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addGoogleCalendar',
                    functionParams: [
                        {
                            paramName: 'credentials',
                            paramValue: 'HIDDEN_CREDENTIALS',
                            paramType: typeof credentials,
                        },
                        {
                            paramName: 'email',
                            paramValue: 'email',
                            paramType: typeof email,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Duplicate Integreation',
                    startLogId,
                });
                return {
                    message: 'Duplicate Integration',
                    status: 409,
                };
            }
            const payloadData = {
                userId: UserId,
                type: 'googlecalendar',
                credentials,
                userEmail: email,
                isPrimary: !existingGoogleCalendar,
            };
            const hasGoogleCalendar = yield Credential.exists({ userId: UserId, type: 'googlecalendar' });
            const encryptedData = yield encryptObject({}, payloadData, fieldsToEncrypt.GoogleCredential);
            const newCredential = yield Credential.create(encryptedData);
            yield User.findByIdAndUpdate(UserId, {
                $push: {
                    'accountDetails.credentialIDs': newCredential._id,
                    'accountDetails.allowedConferenceTypes': hasGoogleCalendar ? [] : 'googleMeet',
                },
            }).exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'addGoogleCalendar',
                functionParams: [
                    {
                        paramName: 'credentials',
                        paramValue: 'HIDDEN_CREDENTIALS',
                        paramType: typeof credentials,
                    },
                    {
                        paramName: 'email',
                        paramValue: 'email',
                        paramType: typeof email,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Credentials Updated Successfully',
                startLogId,
            });
            return {
                message: 'Credentials Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addGoogleCalendar',
                    functionParams: [
                        {
                            paramName: 'credentials',
                            paramValue: 'HIDDEN_CREDENTIALS',
                            paramType: typeof credentials,
                        },
                        {
                            paramName: 'email',
                            paramValue: 'email',
                            paramType: typeof email,
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
            const decodedToken = jwt.verify(context.token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'addGoogleCalendar',
                functionParams: [
                    {
                        paramName: 'credentials',
                        paramValue: 'HIDDEN_CREDENTIALS',
                        paramType: typeof credentials,
                    },
                    {
                        paramName: 'email',
                        paramValue: 'email',
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
                message: err.message,
                status: 500,
            };
        }
    }),
    deleteGoogleCalendar: (parent, { token, email }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const { UserId } = decodedToken;
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'deleteGoogleCalendar',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
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
            const deletedCredential = yield Credential.findOneAndDelete({
                userId: UserId,
                type: 'googlecalendar',
                userEmail: email,
            })
                .orFail(() => new Error('Document Not Found'))
                .exec();
            const newPrimary = yield Credential.findOneAndUpdate({
                userId: UserId,
                type: 'googlecalendar',
            }, {
                $set: {
                    isPrimary: true,
                },
            }).exec();
            yield User.findByIdAndUpdate(UserId, {
                $pull: {
                    'accountDetails.credentialIDs': deletedCredential._id,
                    'accountDetails.allowedConferenceTypes': newPrimary ? undefined : 'googleMeet',
                },
            }).exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'deleteGoogleCalendar',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
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
                additionalMessage: 'Credentials Deleted Successfully',
            });
            return {
                message: 'Credentials Deleted Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteGoogleCalendar',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'deleteGoogleCalendar',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
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
            });
            return {
                message: err.message,
                status: 500,
            };
        }
    }),
    updateGoogleRefreshToken: (parent, { refreshToken, credentialId }, context) => __awaiter(void 0, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateGoogleRefreshToken',
                    functionParams: [
                        {
                            paramName: 'refreshToken',
                            paramValue: refreshToken,
                            paramType: typeof refreshToken,
                        },
                        {
                            paramName: 'credentialId',
                            paramValue: credentialId,
                            paramType: typeof credentialId,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'updateGoogleRefreshToken',
                functionParams: [
                    {
                        paramName: 'refreshToken',
                        paramValue: refreshToken,
                        paramType: typeof refreshToken,
                    },
                    {
                        paramName: 'credentialId',
                        paramValue: credentialId,
                        paramType: typeof credentialId,
                    },
                ],
            });
            const encryptedRefreshToken = yield encrypt(refreshToken, ENV_VALUES.ENCRYPTION_SECRET);
            yield Credential.findByIdAndUpdate(credentialId, {
                $set: {
                    'credentials.refresh_token': encryptedRefreshToken,
                },
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'updateGoogleRefreshToken',
                functionParams: [
                    {
                        paramName: 'refreshToken',
                        paramValue: refreshToken,
                        paramType: typeof refreshToken,
                    },
                    {
                        paramName: 'credentialId',
                        paramValue: credentialId,
                        paramType: typeof credentialId,
                    },
                ],
                additionalMessage: 'Credentials Updated Successfully',
                startLogId,
            });
            return {
                message: 'Credentials Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'updateGoogleRefreshToken',
                functionParams: [
                    {
                        paramName: 'refreshToken',
                        paramValue: refreshToken,
                        paramType: typeof refreshToken,
                    },
                    {
                        paramName: 'credentialId',
                        paramValue: credentialId,
                        paramType: typeof credentialId,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                message: err.message,
                status: 500,
            };
        }
    }),
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=resolvers.js.map