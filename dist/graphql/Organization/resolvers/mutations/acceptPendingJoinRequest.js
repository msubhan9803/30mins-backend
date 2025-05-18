var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LANGUAGES } from '../../../../constants/enums';
import { languageCode } from '../../../../utils/languageCode';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import PendingJoinRequest from '../../../../MongoModels/PendingJoinRequest';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { PROFILE_LINK } from '../../../../constants/variables';
export default function acceptPendingJoinRequest(parent, { token, pendingRequestId }, context, info) {
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
                functionName: 'acceptPendingJoinRequest',
                functionParams: [
                    {
                        paramName: 'pendingRequestId',
                        paramValue: pendingRequestId,
                        paramType: typeof pendingRequestId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'accepterUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const existingRequest = yield PendingJoinRequest.findById(pendingRequestId)
                .populate('requesterUserId', [
                '_id',
                'accountDetails.email',
                'accountDetails.username',
                'personalDetails.name',
                'personalDetails.language',
            ])
                .populate('organizationId', ['_id', 'title']);
            if (!existingRequest) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'acceptPendingJoinRequest',
                    functionParams: [
                        {
                            paramName: 'pendingRequestId',
                            paramValue: pendingRequestId,
                            paramType: typeof pendingRequestId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'accepterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'No Pending Request exists for this User',
                    startLogId,
                });
                return {
                    message: 'No Pending Request exists for this User',
                    status: 404,
                };
            }
            const accepterUserId = decodedToken.UserId;
            const requesterUserId = existingRequest.requesterUserId._id;
            const organizationId = existingRequest.organizationId._id;
            const userInOrg = yield OrganizationMembership.exists({
                userId: requesterUserId,
                organizationId,
            });
            if (userInOrg) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'acceptPendingJoinRequest',
                    functionParams: [
                        {
                            paramName: 'pendingRequestId',
                            paramValue: pendingRequestId,
                            paramType: typeof pendingRequestId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'accepterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'User is already in this organization',
                    startLogId,
                });
                return {
                    message: 'User is already in this organization',
                    status: 400,
                };
            }
            const hasPermissions = yield OrganizationMembership.exists({
                userId: accepterUserId,
                organizationId,
                role: { $in: ['admin', 'owner'] },
            });
            if (!hasPermissions) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'acceptPendingJoinRequest',
                    functionParams: [
                        {
                            paramName: 'pendingRequestId',
                            paramValue: pendingRequestId,
                            paramType: typeof pendingRequestId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'accepterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: User Lacks Admin/Owner Permissions',
                    startLogId,
                });
                return {
                    message: 'Invalid Permissions: User Lacks Admin/Owner Permissions',
                    status: 401,
                };
            }
            const createdMember = yield OrganizationMembership.create({
                userId: requesterUserId,
                organizationId,
                role: 'member',
            });
            yield Organization.findByIdAndUpdate(organizationId, {
                $push: {
                    members: createdMember.userId,
                },
            })
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            yield PendingJoinRequest.findByIdAndDelete(pendingRequestId);
            yield sendEmail({
                requesterName: existingRequest.requesterUserId.personalDetails.name,
                organizationTitle: existingRequest.organizationId.title,
                requesterEmail: existingRequest.requesterUserId.accountDetails.email,
                requesterProfileLink: PROFILE_LINK + existingRequest.requesterUserId.accountDetails.username,
                requestStatus: 'Accepted',
                [languageCode(((_b = (_a = existingRequest.requesterUserId) === null || _a === void 0 ? void 0 : _a.personalDetails) === null || _b === void 0 ? void 0 : _b.language) || LANGUAGES.ENGLISH)]: true,
            }, existingRequest.requesterUserId.accountDetails.email, TEMPLATES.ORGANIZATIONS.REQUEST_STATUS);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'acceptPendingJoinRequest',
                functionParams: [
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
                    {
                        paramName: 'pendingRequestId',
                        paramValue: pendingRequestId,
                        paramType: typeof pendingRequestId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'accepterUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Accepted Request Successfully',
                startLogId,
            });
            return {
                message: 'Accepted Request Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'acceptPendingJoinRequest',
                    functionParams: [
                        {
                            paramName: 'pendingRequestId',
                            paramValue: pendingRequestId,
                            paramType: typeof pendingRequestId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
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
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'acceptPendingJoinRequest',
                functionParams: [
                    {
                        paramName: 'pendingRequestId',
                        paramValue: pendingRequestId,
                        paramType: typeof pendingRequestId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'accepterUserId',
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
//# sourceMappingURL=acceptPendingJoinRequest.js.map