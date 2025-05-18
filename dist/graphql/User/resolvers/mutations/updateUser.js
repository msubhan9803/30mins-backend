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
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import ZipConversion from '../../../../MongoModels/ZipConversion';
import escapeStringRegexp from 'escape-string-regexp';
import encryptObject from '../../../../utils/encryption/encryptObject';
import fieldsToEncrypt from '../../../../constants/fieldsToEncrypt';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function updateUser(parent, { userData, token }) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId = '';
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const data = userData;
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'updateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const existingUser = yield User.findById(decodedToken.UserId).orFail(() => new Error('User Document Not Found'));
            // // If Username is Present Verify Non-Dupe Username
            if ((_a = data === null || data === void 0 ? void 0 : data.accountDetails) === null || _a === void 0 ? void 0 : _a.username) {
                const safeUsername = escapeStringRegexp(userData === null || userData === void 0 ? void 0 : userData.accountDetails.username);
                const pattern = `^${safeUsername}$`;
                const regex = new RegExp(pattern, 'i');
                const dupeUsername = yield User.findOne({ 'accountDetails.username': { $regex: regex } }, '_id accountDetails.username');
                if (dupeUsername && decodedToken.UserId !== dupeUsername._id.valueOf()) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'updateUser',
                        functionParams: [
                            { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                            {
                                paramName: 'userId',
                                paramValue: decodedToken.UserId,
                                paramType: typeof decodedToken.UserId,
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
                    yield User.findByIdAndUpdate(decodedToken.UserId, {
                        $set: {
                            'locationDetails.latitude': latLngData.latitude,
                            'locationDetails.longitude': latLngData.longitude,
                        },
                    });
                }
            }
            const updatedUser = yield encryptObject(existingUser, userData, fieldsToEncrypt.User);
            if ((_c = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _c === void 0 ? void 0 : _c.searchTags) {
                updatedUser.personalDetails.searchTags = (_d = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _d === void 0 ? void 0 : _d.searchTags;
            }
            if ((_e = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _e === void 0 ? void 0 : _e.searchTags) {
                updatedUser.personalDetails.searchTags = (_f = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _f === void 0 ? void 0 : _f.searchTags;
            }
            yield User.findByIdAndUpdate(existingUser._id, { $set: updatedUser }, { strict: false, runValidators: true });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'updateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
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
                    functionName: 'updateUser',
                    functionParams: [{ paramName: 'userData', paramValue: userData, paramType: typeof userData }],
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
                    functionName: 'updateUser',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
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
                functionName: 'updateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
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
//# sourceMappingURL=updateUser.js.map