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
import ZipConversion from '../../../../MongoModels/ZipConversion';
import escapeStringRegexp from 'escape-string-regexp';
import fieldsToEncrypt from '../../../../constants/fieldsToEncrypt';
import encryptObject from '../../../../utils/encryption/encryptObject';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function backendUpdateUser(parent, { userData, email }, context, info) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'backendUpdateUser',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
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
                functionName: 'backendUpdateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                ],
            });
            const safeEmail = escapeStringRegexp(email.trim());
            const emailPattern = `^${safeEmail}$`;
            const emailRegex = new RegExp(emailPattern, 'i');
            const existingUser = yield User.findOne({ 'accountDetails.email': { $regex: emailRegex } }).orFail(() => new Error('User Document Not Found'));
            // // If Username is Present Verify Non-Dupe Username
            if ((_a = userData === null || userData === void 0 ? void 0 : userData.accountDetails) === null || _a === void 0 ? void 0 : _a.username) {
                const safeUsername = escapeStringRegexp(userData === null || userData === void 0 ? void 0 : userData.accountDetails.username);
                const pattern = `^${safeUsername}$`;
                const regex = new RegExp(pattern, 'i');
                const dupeUsername = yield User.findOne({ 'accountDetails.username': { $regex: regex } }, '_id accountDetails.username');
                if (dupeUsername && existingUser._id.valueOf() !== dupeUsername._id.valueOf()) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'backendUpdateUser',
                        functionParams: [
                            { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                            {
                                paramName: 'email',
                                paramValue: email,
                                paramType: typeof email,
                            },
                        ],
                        additionalMessage: 'Username Already Exists',
                        startLogId,
                    });
                    return {
                        message: 'Username Already Exists',
                        status: 409,
                    };
                }
            }
            if ((_b = userData === null || userData === void 0 ? void 0 : userData.locationDetails) === null || _b === void 0 ? void 0 : _b.zipCode) {
                const { country } = existingUser.locationDetails;
                const latLngData = yield ZipConversion.findOne({
                    zipCode: userData.locationDetails.zipCode,
                    country,
                }).exec();
                if (latLngData) {
                    const zipUpdatedUser = yield User.findByIdAndUpdate(existingUser._id, {
                        $set: {
                            'locationDetails.latitude': latLngData.latitude,
                            'locationDetails.longitude': latLngData.longitude,
                        },
                    });
                }
            }
            const updatedUser = yield encryptObject(existingUser, userData, fieldsToEncrypt.User);
            yield User.findByIdAndUpdate(existingUser._id, { $set: updatedUser }, { strict: false, runValidators: true });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'backendUpdateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                ],
                additionalMessage: 'User Updated Successfully',
                startLogId,
            });
            return {
                message: 'User Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'User validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'backendUpdateUser',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                    ],
                    additionalMessage: err.message,
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
                functionName: 'backendUpdateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
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
//# sourceMappingURL=backendUpdateUser.js.map