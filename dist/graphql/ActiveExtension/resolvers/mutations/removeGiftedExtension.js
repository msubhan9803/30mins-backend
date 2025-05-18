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
export default function removeGiftedExtension(parent, { extensionProductId, userEmail }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'removeGiftedExtension',
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
                functionName: 'removeGiftedExtension',
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
                ],
            });
            const safeEmail = escapeStringRegexp(userEmail);
            const emailPattern = `^${safeEmail}$`;
            const emailRegex = new RegExp(emailPattern, 'i');
            const user = yield User.findOne({ 'accountDetails.email': { $regex: emailRegex } })
                .orFail(() => new Error('User Document Not Found'))
                .exec();
            const deletedExtension = yield ActiveExtension.findOneAndDelete({
                userId: user._id,
                extensionProductId,
            }).orFail(() => new Error('Active Extension Document Not Found'));
            yield User.findByIdAndUpdate(user._id, {
                $pull: {
                    'accountDetails.activeExtensions': extensionProductId,
                    'accountDetails.activeExtensionIDs': deletedExtension._id,
                },
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'removeGiftedExtension',
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
                ],
                additionalMessage: 'Active Extension Removed Successfully',
                startLogId,
            });
            return {
                message: 'Active Extension Removed Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (['Active Extension Document Not Found', 'User Document Not Found'].includes(err.message)) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'removeGiftedExtension',
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
                    ],
                    additionalMessage: err.message,
                    startLogId,
                });
                return {
                    message: err.message,
                    status: 404,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'removeGiftedExtension',
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
//# sourceMappingURL=removeGiftedExtension.js.map