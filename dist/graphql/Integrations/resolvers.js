var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import Credential from '../../MongoModels/Credential';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../utils/createApiLog';
import decryptObject from '../../utils/encryption/decryptObject';
import AwsSecrets from '../../utils/getAwsSecrets';
import User from '../../MongoModels/User';
const queries = {
    getCredentialsByUserId: (parent, { userId }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        let startLogId;
        const ENV_VALUES = yield AwsSecrets.getInstance();
        try {
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getCredentialsByUserId',
                    functionParams: [
                        {
                            paramName: 'userId',
                            paramValue: userId,
                            paramType: typeof userId,
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
                functionName: 'getCredentialsByUserId',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: userId,
                        paramType: typeof userId,
                    },
                ],
            });
            const credentialsEncrypted = yield Credential.find({
                userId: userId,
            }).exec();
            const credentials = [];
            try {
                for (var credentialsEncrypted_1 = __asyncValues(credentialsEncrypted), credentialsEncrypted_1_1; credentialsEncrypted_1_1 = yield credentialsEncrypted_1.next(), !credentialsEncrypted_1_1.done;) {
                    const credential = credentialsEncrypted_1_1.value;
                    const decryptedCredential = yield decryptObject(credential);
                    credentials.push(decryptedCredential);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (credentialsEncrypted_1_1 && !credentialsEncrypted_1_1.done && (_a = credentialsEncrypted_1.return)) yield _a.call(credentialsEncrypted_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (credentials.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getCredentialsByUserId',
                    functionParams: [
                        {
                            paramName: 'userId',
                            paramValue: userId,
                            paramType: typeof userId,
                        },
                    ],
                    additionalMessage: 'Document Not Found',
                });
                return {
                    response: {
                        message: 'Document Not Found',
                        status: 404,
                    },
                };
            }
            const officeCredentials = credentials.filter(credential => credential.type === 'office365calendar');
            const googleCredentials = credentials.filter(credential => credential.type === 'googlecalendar');
            const zoomCredentials = credentials.filter(credential => credential.type === 'zoom');
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getCredentialsByUserId',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: userId,
                        paramType: typeof userId,
                    },
                ],
                additionalMessage: 'Query Successful',
            });
            return {
                officeCredentials: officeCredentials,
                googleCredentials: googleCredentials,
                zoomCredentials: zoomCredentials,
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
                functionName: 'getCredentialsByUserId',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: userId,
                        paramType: typeof userId,
                    },
                ],
                additionalMessage: err.message,
            });
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    }),
    getCredentialsByToken: (parent, { token }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        var e_2, _b;
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getCredentialsByToken',
                functionParams: [
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
            const credentialsEncrypted = yield Credential.find({
                userId: decodedToken.UserId,
            }).exec();
            const credentials = [];
            try {
                for (var credentialsEncrypted_2 = __asyncValues(credentialsEncrypted), credentialsEncrypted_2_1; credentialsEncrypted_2_1 = yield credentialsEncrypted_2.next(), !credentialsEncrypted_2_1.done;) {
                    const credential = credentialsEncrypted_2_1.value;
                    const decryptedCredential = yield decryptObject(credential);
                    credentials.push(decryptedCredential);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (credentialsEncrypted_2_1 && !credentialsEncrypted_2_1.done && (_b = credentialsEncrypted_2.return)) yield _b.call(credentialsEncrypted_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            if (credentials.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getCredentialsByToken',
                    functionParams: [
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
                    additionalMessage: 'Document Not Found',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Document Not Found',
                        status: 404,
                    },
                };
            }
            const officeCredentials = credentials.filter(credential => credential.type === 'office365calendar');
            const googleCredentials = credentials.filter(credential => credential.type === 'googlecalendar');
            const zoomCredentials = credentials.filter(credential => credential.type === 'zoom');
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getCredentialsByToken',
                functionParams: [
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
                officeCredentials: officeCredentials,
                googleCredentials: googleCredentials,
                zoomCredentials: zoomCredentials,
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
                    functionName: 'getCredentialsByToken',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
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
                functionName: 'getCredentialsByToken',
                functionParams: [
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
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    }),
    getCredentialsByEmail: (parent, { email }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        var e_3, _c;
        let startLogId;
        try {
            // const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getCredentialsByToken',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                ],
            });
            const user = yield User.findOne({
                'accountDetails.email': email,
            }).orFail(() => new Error('User Document Not Found'));
            const credentialsEncrypted = yield Credential.find({
                userId: user === null || user === void 0 ? void 0 : user._id,
            }).exec();
            const credentials = [];
            try {
                for (var credentialsEncrypted_3 = __asyncValues(credentialsEncrypted), credentialsEncrypted_3_1; credentialsEncrypted_3_1 = yield credentialsEncrypted_3.next(), !credentialsEncrypted_3_1.done;) {
                    const credential = credentialsEncrypted_3_1.value;
                    const decryptedCredential = yield decryptObject(credential);
                    credentials.push(decryptedCredential);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (credentialsEncrypted_3_1 && !credentialsEncrypted_3_1.done && (_c = credentialsEncrypted_3.return)) yield _c.call(credentialsEncrypted_3);
                }
                finally { if (e_3) throw e_3.error; }
            }
            if (credentials.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getCredentialsByToken',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                    ],
                    additionalMessage: 'Document Not Found',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Document Not Found',
                        status: 404,
                    },
                };
            }
            const officeCredentials = credentials.filter(credential => {
                return credential.type === 'office365calendar';
            });
            const googleCredentials = credentials.filter(credential => {
                return credential.type === 'googlecalendar';
            });
            const zoomCredentials = credentials.filter(credential => {
                return credential.type === 'zoom';
            });
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getCredentialsByToken',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                hasOfficeCredentials: (officeCredentials === null || officeCredentials === void 0 ? void 0 : officeCredentials.length) > 0,
                hasGoogleCredentials: (googleCredentials === null || googleCredentials === void 0 ? void 0 : googleCredentials.length) > 0,
                hasZoomCredentials: (zoomCredentials === null || zoomCredentials === void 0 ? void 0 : zoomCredentials.length) > 0,
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
                    functionName: 'getCredentialsByToken',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
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
    toggleCredentialById: (parent, { credentialId, token }) => __awaiter(void 0, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'toggleCredentialById',
                functionParams: [
                    {
                        paramName: 'credentialId',
                        paramValue: credentialId,
                        paramType: typeof credentialId,
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
            const credentialsEncrypted = yield Credential.find({
                userId: decodedToken.UserId,
            }).exec();
            for (let index = 0; index < credentialsEncrypted.length; index++) {
                let credential = credentialsEncrypted[index];
                if (credential.type === 'googlecalendar') {
                    if (credential._id.toString() === credentialId) {
                        credential.isPrimary = true;
                    }
                    else {
                        credential.isPrimary = false;
                    }
                    yield credential.save();
                }
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'toggleCredentialById',
                functionParams: [
                    {
                        paramName: 'credentialId',
                        paramValue: credentialId,
                        paramType: typeof credentialId,
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
                additionalMessage: 'Credential marked as primary successfully',
                startLogId,
            });
            return {
                message: 'Credential marked as primary successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'toggleCredentialById',
                    functionParams: [
                        {
                            paramName: 'credentialId',
                            paramValue: credentialId,
                            paramType: typeof credentialId,
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
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'toggleCredentialById',
                functionParams: [
                    {
                        paramName: 'credentialId',
                        paramValue: credentialId,
                        paramType: typeof credentialId,
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
                message: err.message,
                status: 500,
            };
        }
    }),
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=resolvers.js.map