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
import generateUsername from '../../../../utils/generateUsername';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import StatisticsProcessingQueue from '../../../../MongoModels/StatisticsProcessingQueue';
import dayjs from 'dayjs';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import Organization from '../../../../MongoModels/Organization';
export default function handleSignIn(parent, { email, name, referralId }, context, info) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'handleSignIn',
                functionParams: [
                    { paramName: 'email', paramValue: email, paramType: typeof email },
                    { paramName: 'name', paramValue: name, paramType: typeof name },
                ],
            });
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'handleSignIn',
                    functionParams: [
                        { paramName: 'email', paramValue: email, paramType: typeof email },
                        { paramName: 'name', paramValue: name, paramType: typeof name },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid BACKEND_API_KEY',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const safeEmail = escapeStringRegexp(email);
            const pattern = `^${safeEmail}$`;
            const regex = new RegExp(pattern, 'i');
            const existingUser = yield User.findOne({ 'accountDetails.email': { $regex: regex } });
            if (!existingUser) {
                const username = yield generateUsername(name, Math.floor(1000 + Math.random() * 9000));
                const newUser = yield User.create({
                    'accountDetails.username': username,
                    'accountDetails.email': email,
                    'personalDetails.name': name,
                    referralId: referralId || null,
                });
                const userId = newUser._id.valueOf();
                if (referralId) {
                    const createdActiveExtension = yield ActiveExtension.create({
                        userId: userId,
                        extensionProductId: stripeProductIDs.EXTENSIONS.PAID_MEETINGS,
                        extensionTitle: 'Paid Meetings',
                        status: 'gifted',
                        customerId: `Referral: ${referralId}`,
                        subscriptionId: 'gifted',
                        paymentMethodId: 'gifted',
                    });
                    yield User.findByIdAndUpdate(userId, {
                        $push: {
                            'accountDetails.activeExtensions': stripeProductIDs.EXTENSIONS.PAID_MEETINGS,
                            'accountDetails.activeExtensionIDs': createdActiveExtension._id,
                        },
                    });
                    yield Organization.findByIdAndUpdate(referralId, { $inc: { referralCount: 1 } });
                }
                const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
                const token = jwt.sign({ UserId: userId }, accessTokenSecret, {
                    algorithm: 'HS256',
                    expiresIn: '7d',
                });
                yield StatisticsProcessingQueue.create({
                    schemaName: 'GlobalBussiness',
                    fields: {
                        totalUsersSignedUp: 1,
                    },
                    timeStamp: dayjs().toISOString(),
                });
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'handleSignIn',
                    functionParams: [
                        { paramName: 'email', paramValue: email, paramType: typeof email },
                        { paramName: 'name', paramValue: name, paramType: typeof name },
                    ],
                    additionalMessage: `User Created: ${username} - ID: ${userId}`,
                    startLogId,
                });
                return {
                    message: token,
                    status: 200,
                };
            }
            if (existingUser) {
                if (((_a = existingUser === null || existingUser === void 0 ? void 0 : existingUser.accountDetails) === null || _a === void 0 ? void 0 : _a.verifiedEmail) === false) {
                    const updatedUser = yield User.findByIdAndUpdate(existingUser._id, {
                        $set: {
                            'accountDetails.verifiedEmail': true,
                        },
                    }).exec();
                }
                const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
                const token = jwt.sign({ UserId: existingUser._id }, accessTokenSecret, {
                    algorithm: 'HS256',
                    expiresIn: '7d',
                });
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'handleSignIn',
                    functionParams: [
                        { paramName: 'email', paramValue: email, paramType: typeof email },
                        { paramName: 'name', paramValue: name, paramType: typeof name },
                    ],
                    additionalMessage: `Token Generated`,
                    startLogId,
                });
                return {
                    message: token,
                    status: 200,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'handleSignIn',
                functionParams: [
                    { paramName: 'email', paramValue: email, paramType: typeof email },
                    { paramName: 'name', paramValue: name, paramType: typeof name },
                ],
                additionalMessage: `User Not Found`,
                startLogId,
            });
            return {
                message: 'User Not Found',
                status: 404,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'handleSignIn',
                functionParams: [
                    { paramName: 'email', paramValue: email, paramType: typeof email },
                    { paramName: 'name', paramValue: name, paramType: typeof name },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                message: 'Unknown Error',
                status: 404,
            };
        }
    });
}
//# sourceMappingURL=handleSignIn.js.map