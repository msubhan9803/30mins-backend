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
import User from '../../../../MongoModels/User';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import escapeStringRegexp from 'escape-string-regexp';
import deleteImageFromBucket from '../../../../utils/deleteImageFromBucket';
import Service from '../../../../MongoModels/Service';
import Publication from '../../../../MongoModels/Publication';
import EducationHistory from '../../../../MongoModels/EducationHistory';
import JobHistory from '../../../../MongoModels/JobHistory';
import Credential from '../../../../MongoModels/Credential';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import Conversation from '../../../../MongoModels/Conversation';
import Message from '../../../../MongoModels/Message';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
export default function marketerDeleteUser(parent, { userEmail }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        const { token } = context;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'marketerDeleteUser',
                functionParams: [
                    {
                        paramName: 'marketerId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: userEmail,
                        paramType: typeof userEmail,
                    },
                ],
            });
            const marketingUser = yield User.findOne({
                _id: decodedToken.UserId,
                isMarketer: true,
            });
            if (!marketingUser) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerDeleteUser',
                    functionParams: [
                        {
                            paramName: 'userEmail',
                            paramValue: userEmail,
                            paramType: typeof userEmail,
                        },
                    ],
                    additionalMessage: 'Not Authenticated: User Lacks Marketer Permissions',
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
            const deletedUser = yield User.findOneAndDelete({
                'accountDetails.email': { $regex: emailRegex },
                welcomeComplete: false,
                $or: [{ createdBy: marketingUser._id }, { affiliateTeamCreatedBy: marketingUser.affiliateTeam }],
            });
            if (!deletedUser) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerDeleteUser',
                    functionParams: [
                        { paramName: 'userEmail', paramValue: userEmail, paramType: typeof userEmail },
                    ],
                    additionalMessage: 'User Not Found',
                    startLogId,
                });
                return {
                    message: 'User Not Found',
                    status: 404,
                };
            }
            if (deletedUser.accountDetails.avatar) {
                yield deleteImageFromBucket(deletedUser.accountDetails.avatar);
            }
            yield Service.deleteMany({ userId: deletedUser._id });
            yield Publication.deleteMany({ userId: deletedUser._id });
            yield EducationHistory.deleteMany({ userId: deletedUser._id });
            yield JobHistory.deleteMany({ userId: deletedUser._id });
            yield Credential.deleteMany({ userId: deletedUser._id });
            yield OrganizationMembership.deleteMany({ userId: deletedUser._id });
            yield ActiveExtension.deleteMany({ userId: deletedUser._id });
            yield Conversation.deleteMany({ members: { $elemMatch: { $eq: deletedUser._id } } });
            yield Message.deleteMany({ $or: [{ receiver: deletedUser._id }, { sender: deletedUser._id }] });
            yield RoundRobinTeam.findOneAndUpdate({
                teamMembers: {
                    $elemMatch: { memberId: deletedUser._id },
                },
            }, { $pull: { teamMembers: { memberId: deletedUser._id } } });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'marketerDeleteUser',
                functionParams: [
                    {
                        paramName: 'marketerId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: userEmail,
                        paramType: typeof userEmail,
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
                    functionName: 'marketerDeleteUser',
                    functionParams: [
                        {
                            paramName: 'userEmail',
                            paramValue: userEmail,
                            paramType: typeof userEmail,
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
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'marketerDeleteUser',
                functionParams: [
                    {
                        paramName: 'userEmail',
                        paramValue: userEmail,
                        paramType: typeof userEmail,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            console.log(err);
            return {
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=marketerDeleteUser.js.map