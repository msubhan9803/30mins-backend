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
import AwsSecrets from '../../../../utils/getAwsSecrets';
import _ from 'lodash';
export default function adminUpdateUser(parent, { userData, token, documentId }, context, info) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'adminUpdateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    {
                        paramName: 'adminUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
                    functionName: 'adminUpdateUser',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        {
                            paramName: 'adminUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
            const existingUser = yield User.findById(documentId).orFail(() => new Error('User Document Not Found'));
            // // If Username is Present Verify Non-Dupe Username
            if ((_a = userData === null || userData === void 0 ? void 0 : userData.accountDetails) === null || _a === void 0 ? void 0 : _a.username) {
                const safeUsername = escapeStringRegexp(userData === null || userData === void 0 ? void 0 : userData.accountDetails.username);
                const pattern = `^${safeUsername}$`;
                const regex = new RegExp(pattern, 'i');
                const dupeUsername = yield User.findOne({ 'accountDetails.username': { $regex: regex } }, '_id accountDetails.username');
                if (dupeUsername && documentId !== dupeUsername._id.valueOf()) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'adminUpdateUser',
                        functionParams: [
                            { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                            {
                                paramName: 'adminUserId',
                                paramValue: decodedToken.UserId,
                                paramType: typeof decodedToken.UserId,
                            },
                            {
                                paramName: 'documentId',
                                paramValue: documentId,
                                paramType: typeof documentId,
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
                    const zipUpdatedUser = yield User.findByIdAndUpdate(decodedToken.UserId, {
                        $set: {
                            'locationDetails.latitude': latLngData.latitude,
                            'locationDetails.longitude': latLngData.longitude,
                        },
                    });
                }
            }
            // eslint-disable-next-line consistent-return
            const mergeCustomizer = (objValue, srcValue) => {
                if (_.isArray(objValue)) {
                    return srcValue;
                }
            };
            const mergedObject = _.merge(existingUser, userData, mergeCustomizer);
            yield User.findByIdAndUpdate(existingUser._id, { $set: mergedObject }, { strict: false, runValidators: true });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'adminUpdateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    {
                        paramName: 'adminUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
                    functionName: 'adminUpdateUser',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'User validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'adminUpdateUser',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        {
                            paramName: 'adminUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
                functionName: 'adminUpdateUser',
                functionParams: [
                    { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                    {
                        paramName: 'adminUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
//# sourceMappingURL=adminUpdateUser.js.map