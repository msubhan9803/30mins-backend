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
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import deleteImageFromBucket from '../../../../utils/deleteImageFromBucket';
import User from '../../../../MongoModels/User';
import Service from '../../../../MongoModels/Service';
import Publication from '../../../../MongoModels/Publication';
import EducationHistory from '../../../../MongoModels/EducationHistory';
import JobHistory from '../../../../MongoModels/JobHistory';
import Credential from '../../../../MongoModels/Credential';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Conversation from '../../../../MongoModels/Conversation';
import Message from '../../../../MongoModels/Message';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
import StatisticsProcessingQueue from '../../../../MongoModels/StatisticsProcessingQueue';
import dayjs from 'dayjs';
export default function deleteUser(parent, { token }, context, info) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'deleteUser',
                functionParams: [
                    { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const deletedUser = yield User.findOneAndDelete({ _id: decodedToken.UserId })
                .orFail(() => new Error('Document Not Found'))
                .exec();
            if (deletedUser.accountDetails.avatar) {
                yield deleteImageFromBucket(deletedUser.accountDetails.avatar);
            }
            yield Service.deleteMany({ userId: deletedUser._id }).exec();
            yield Publication.deleteMany({ userId: deletedUser._id }).exec();
            yield EducationHistory.deleteMany({ userId: deletedUser._id }).exec();
            yield JobHistory.deleteMany({ userId: deletedUser._id }).exec();
            yield Credential.deleteMany({ userId: deletedUser._id }).exec();
            yield OrganizationMembership.deleteMany({ userId: deletedUser._id }).exec();
            yield ActiveExtension.deleteMany({ userId: deletedUser._id }).exec();
            yield Conversation.deleteMany({ members: { $elemMatch: { $eq: deletedUser._id } } });
            yield Message.deleteMany({ $or: [{ receiver: deletedUser._id }, { sender: deletedUser._id }] });
            yield RoundRobinTeam.findOneAndUpdate({
                teamMembers: {
                    $elemMatch: { memberId: deletedUser._id },
                },
            }, { $pull: { teamMembers: { memberId: deletedUser._id } } });
            if (deletedUser === null || deletedUser === void 0 ? void 0 : deletedUser.welcomeComplete) {
                yield StatisticsProcessingQueue.create({
                    schemaName: 'GlobalBussiness',
                    fields: {
                        totalUsersWelcomeComplete: -1,
                    },
                    timeStamp: dayjs().toISOString(),
                });
            }
            if ((_a = deletedUser === null || deletedUser === void 0 ? void 0 : deletedUser.accountDetails) === null || _a === void 0 ? void 0 : _a.verifiedAccount) {
                yield StatisticsProcessingQueue.create({
                    schemaName: 'GlobalBussiness',
                    fields: {
                        totalUsersVerified: -1,
                    },
                    timeStamp: dayjs().toISOString(),
                });
            }
            yield StatisticsProcessingQueue.create({
                schemaName: 'GlobalBussiness',
                fields: {
                    totalUsersSignedUp: -1,
                },
                timeStamp: dayjs().toISOString(),
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'deleteUser',
                functionParams: [
                    { paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'User Deleted Successfully',
                startLogId,
            });
            return {
                message: 'User Deleted Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteUser',
                    functionParams: [{ paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token }],
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
                functionName: 'deleteUser',
                functionParams: [
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
//# sourceMappingURL=deleteUser.js.map