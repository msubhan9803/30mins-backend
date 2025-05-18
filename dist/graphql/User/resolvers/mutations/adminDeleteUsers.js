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
export default function adminDeleteUsers(parent, { userIDs }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const { token } = context;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'adminDeleteUsers',
                functionParams: [
                    {
                        paramName: 'adminUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'userIDs',
                        paramValue: userIDs,
                        paramType: typeof userIDs,
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
                    functionName: 'adminDeleteUsers',
                    functionParams: [
                        {
                            paramName: 'userIDs',
                            paramValue: userIDs,
                            paramType: typeof userIDs,
                        },
                    ],
                    additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                    userIDs: [],
                };
            }
            userIDs.forEach((_id) => __awaiter(this, void 0, void 0, function* () {
                const deletedUser = yield User.findOneAndDelete({ _id })
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
                yield Conversation.deleteMany({ members: { $in: [deletedUser._id] } });
                yield Message.deleteMany({ $or: [{ receiver: deletedUser._id }, { sender: deletedUser._id }] });
                yield RoundRobinTeam.findOneAndUpdate({
                    teamMembers: {
                        $elemMatch: { memberId: deletedUser._id },
                    },
                }, { $pull: { teamMembers: { memberId: deletedUser._id } } });
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'adminDeleteUsers',
                    functionParams: [
                        {
                            paramName: 'adminUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'userIDs',
                            paramValue: userIDs,
                            paramType: typeof userIDs,
                        },
                    ],
                    additionalMessage: `User with id: ${_id} Deleted Successfully`,
                    startLogId,
                });
            }));
            return {
                response: {
                    message: 'Users Deleted Successfully By Admin',
                    status: 200,
                },
                userIDs: userIDs,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'adminDeleteUsers',
                    functionParams: [
                        {
                            paramName: 'userIDs',
                            paramValue: userIDs,
                            paramType: typeof userIDs,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                    userIDs: [],
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'adminDeleteUsers',
                functionParams: [
                    {
                        paramName: 'adminUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'userIDs',
                        paramValue: userIDs,
                        paramType: typeof userIDs,
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
                userIDs: [],
            };
        }
    });
}
//# sourceMappingURL=adminDeleteUsers.js.map