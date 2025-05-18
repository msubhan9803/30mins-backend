var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { languageCode } from '../../../../utils/languageCode';
import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import ZipConversion from '../../../../MongoModels/ZipConversion';
import escapeStringRegexp from 'escape-string-regexp';
import sendEmail from '../../../../utils/sendEmailHandler';
import EmailTemplates from '../../../../constants/emailTemplateIDs';
import fieldsToEncrypt from '../../../../constants/fieldsToEncrypt';
import encryptObject from '../../../../utils/encryption/encryptObject';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { LANGUAGES } from '../../../../constants/enums';
export default function updateUserWelcome(parent, { userData, token }, context, info) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const { name, username, country, zipCode, timezone, welcomeComplete } = userData;
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'updateUserWelcome',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            if (username) {
                const safeUsername = escapeStringRegexp(username);
                const pattern = `^${safeUsername}$`;
                const regex = new RegExp(pattern, 'i');
                const dupeUsername = yield User.findOne({ 'accountDetails.username': { $regex: regex } }, '_id accountDetails.username');
                if (dupeUsername && decodedToken.UserId !== dupeUsername._id.valueOf()) {
                    return {
                        message: 'Username Already Exists',
                        status: 409,
                    };
                }
            }
            const updateData = {
                welcomeComplete,
                personalDetails: {
                    name: name,
                },
                accountDetails: {
                    username: username,
                },
                locationDetails: {
                    zipCode: zipCode,
                    country: country,
                    timezone: timezone,
                    latitude: undefined,
                    longitude: undefined,
                },
            };
            if (zipCode && country) {
                const latLngData = yield ZipConversion.findOne({
                    zipCode,
                    country,
                }).exec();
                if (latLngData) {
                    updateData.locationDetails.latitude = latLngData.latitude;
                    updateData.locationDetails.longitude = latLngData.longitude;
                }
            }
            const existingUser = yield User.findById(decodedToken.UserId).orFail(() => new Error('User Document Not Found'));
            const updatedUser = yield encryptObject(existingUser, updateData, fieldsToEncrypt.User);
            yield User.findByIdAndUpdate(existingUser._id, { $set: updatedUser }, { strict: false, runValidators: true });
            if (welcomeComplete) {
                yield sendEmail({
                    name: updatedUser.personalDetails.name,
                    username: updatedUser.accountDetails.username,
                    calendarLinked: ((_b = (_a = updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.accountDetails) === null || _a === void 0 ? void 0 : _a.credentialIDs) === null || _b === void 0 ? void 0 : _b.length) > 0,
                    [languageCode(((_c = updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.accountDetails) === null || _c === void 0 ? void 0 : _c.language) || LANGUAGES.ENGLISH)]: true,
                }, updatedUser.accountDetails.email, EmailTemplates.OUTREACH.WELCOME_COMPLETE, 'signups@30mins.com');
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'updateUserWelcome',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
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
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateUserWelcome',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'User validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateUserWelcome',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
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
                    status: 400,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'updateUserWelcome',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
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
//# sourceMappingURL=updateUserWelcome.js.map