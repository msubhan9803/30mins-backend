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
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import jwt from 'jsonwebtoken';
export default function adminAddGiftedExtension(parent, { extensionProductId, extensionTitle, userEmail }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        let decodedToken;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
            decodedToken = jwt.verify(context.token, accessTokenSecret);
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getActiveExtensionsForAdmin',
                functionParams: [
                    {
                        paramName: 'extensionProductId',
                        paramValue: extensionProductId,
                        paramType: typeof extensionProductId,
                    },
                    {
                        paramName: 'extensionTitle',
                        paramValue: extensionTitle,
                        paramType: typeof extensionTitle,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: userEmail,
                        paramType: typeof userEmail,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                message: 'Not Authorized',
                status: 401,
            };
        }
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'adminAddGiftedExtension',
                functionParams: [
                    {
                        paramName: 'extensionProductId',
                        paramValue: extensionProductId,
                        paramType: typeof extensionProductId,
                    },
                    {
                        paramName: 'extensionTitle',
                        paramValue: extensionTitle,
                        paramType: typeof extensionTitle,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: userEmail,
                        paramType: typeof userEmail,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const isAdminUser = yield User.exists({
                _id: decodedToken.UserId,
                'accountDetails.accountType': 'admin',
            });
            if (!isAdminUser) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'adminAddGiftedExtension',
                    functionParams: [
                        {
                            paramName: 'extensionProductId',
                            paramValue: extensionProductId,
                            paramType: typeof extensionProductId,
                        },
                        {
                            paramName: 'extensionTitle',
                            paramValue: extensionTitle,
                            paramType: typeof extensionTitle,
                        },
                        {
                            paramName: 'userEmail',
                            paramValue: userEmail,
                            paramType: typeof userEmail,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const safeEmail = escapeStringRegexp(userEmail);
            const emailPattern = `^${safeEmail}$`;
            const emailRegex = new RegExp(emailPattern, 'i');
            const user = yield User.findOne({ 'accountDetails.email': { $regex: emailRegex } }).orFail(() => new Error('User Document Not Found'));
            const existingExtension = yield ActiveExtension.exists({
                userId: user._id,
                extensionProductId,
            });
            if (existingExtension) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'adminAddGiftedExtension',
                    functionParams: [
                        {
                            paramName: 'extensionProductId',
                            paramValue: extensionProductId,
                            paramType: typeof extensionProductId,
                        },
                        {
                            paramName: 'userEmail',
                            paramValue: userEmail,
                            paramType: typeof userEmail,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'User Already has this Extension',
                });
                return {
                    message: 'User Already has this Extension',
                    status: 409,
                };
            }
            const createdActiveExtension = yield ActiveExtension.create({
                userId: user._id,
                extensionProductId,
                extensionTitle,
                status: 'gifted',
                customerId: 'gifted',
                subscriptionId: 'gifted',
                paymentMethodId: 'gifted',
            });
            yield User.findByIdAndUpdate(user._id, {
                $push: {
                    'accountDetails.activeExtensions': extensionProductId,
                    'accountDetails.activeExtensionIDs': createdActiveExtension._id,
                },
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'adminAddGiftedExtension',
                functionParams: [
                    {
                        paramName: 'extensionProductId',
                        paramValue: extensionProductId,
                        paramType: typeof extensionProductId,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: userEmail,
                        paramType: typeof userEmail,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Active Extension Added Successfully',
                startLogId,
            });
            return {
                message: 'Active Extension Added Successfully',
                status: 200,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'ActiveExtension validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'adminAddGiftedExtension',
                    functionParams: [
                        {
                            paramName: 'extensionProductId',
                            paramValue: extensionProductId,
                            paramType: typeof extensionProductId,
                        },
                        {
                            paramName: 'userEmail',
                            paramValue: userEmail,
                            paramType: typeof userEmail,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof context.token,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Mongoose ActiveExtension Validation Failed',
                    startLogId,
                });
                return {
                    message: err.message,
                    status: 400,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'adminAddGiftedExtension',
                functionParams: [
                    {
                        paramName: 'extensionProductId',
                        paramValue: extensionProductId,
                        paramType: typeof extensionProductId,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: userEmail,
                        paramType: typeof userEmail,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof context.token,
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
    });
}
//# sourceMappingURL=adminAddGiftedExtension.js.map