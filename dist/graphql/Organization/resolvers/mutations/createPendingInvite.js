var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { languageCode } from './../../../../utils/languageCode';
import escapeStringRegexp from 'escape-string-regexp';
import jwt from 'jsonwebtoken';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import cuid from 'cuid';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { LANGUAGES } from '../../../../constants/enums';
export default function createPendingInvite(parent, { token, inviteeEmail, organizationId, organizationTitle, language }, context, info) {
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
                functionName: 'createPendingInvite',
                functionParams: [
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'inviterUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'inviteeEmail',
                        paramValue: inviteeEmail,
                        paramType: typeof inviteeEmail,
                    },
                ],
            });
            const inviterUser = yield OrganizationMembership.findOne({
                userId: decodedToken.UserId,
                organizationId,
                role: { $in: ['admin', 'owner'] },
            })
                .populate('userId', ['personalDetails.name', 'personalDetails.language'])
                .exec();
            if (!inviterUser) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingInvite',
                    functionParams: [
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
                        },
                        {
                            paramName: 'organizationTitle',
                            paramValue: organizationTitle,
                            paramType: typeof organizationTitle,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'inviterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'inviteeEmail',
                            paramValue: inviteeEmail,
                            paramType: typeof inviteeEmail,
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
            const safeInviteeEmail = escapeStringRegexp(inviteeEmail);
            const pattern = `^${safeInviteeEmail}$`;
            const inviteeEmailRegex = new RegExp(pattern, 'i');
            const inviteeUser = yield User.findOne({
                'accountDetails.email': { $regex: inviteeEmailRegex },
            }).exec();
            let userInOrg = false;
            if (inviteeUser) {
                userInOrg = yield OrganizationMembership.exists({
                    userId: inviteeUser._id,
                    organizationId,
                });
            }
            if (userInOrg) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingInvite',
                    functionParams: [
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
                        },
                        {
                            paramName: 'organizationTitle',
                            paramValue: organizationTitle,
                            paramType: typeof organizationTitle,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'inviterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'inviteeEmail',
                            paramValue: inviteeEmail,
                            paramType: typeof inviteeEmail,
                        },
                    ],
                    additionalMessage: 'User already in Organization',
                    startLogId,
                });
                return {
                    message: 'User already in Organization',
                    status: 409,
                };
            }
            const existingInvite = yield PendingInvite.exists({
                inviteeEmail: { $regex: inviteeEmailRegex },
                organizationId,
            });
            if (existingInvite) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingInvite',
                    functionParams: [
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
                        },
                        {
                            paramName: 'organizationTitle',
                            paramValue: organizationTitle,
                            paramType: typeof organizationTitle,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'inviterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'inviteeEmail',
                            paramValue: inviteeEmail,
                            paramType: typeof inviteeEmail,
                        },
                    ],
                    additionalMessage: 'Pending Invite already exists for this User',
                    startLogId,
                });
                return {
                    message: 'Pending Invite already exists for this User',
                    status: 409,
                };
            }
            // Existing Invitee User Account
            if (inviteeUser) {
                yield PendingInvite.create({
                    inviteeUserId: inviteeUser._id.valueOf(),
                    inviteeEmail: inviteeUser.accountDetails.email,
                    organizationId,
                    inviterUserId: decodedToken.UserId,
                });
                yield sendEmail({
                    organizationTitle,
                    inviteeName: inviteeUser.personalDetails.name,
                    inviterName: inviterUser.userId.personalDetails.name,
                    inviteeHasAccount: true,
                    [languageCode(((_a = inviteeUser === null || inviteeUser === void 0 ? void 0 : inviteeUser.personalDetails) === null || _a === void 0 ? void 0 : _a.language) || LANGUAGES.ENGLISH)]: true,
                }, inviteeEmail, TEMPLATES.ORGANIZATIONS.INVITE_TO_INVITEE);
            }
            // Non-Existing Invitee User Account
            if (!inviteeUser) {
                const couponCode = cuid.slug();
                const joinLink = `https://30mins.com/join?code=${couponCode}`;
                yield PendingInvite.create({
                    inviteeEmail,
                    organizationId,
                    inviterUserId: decodedToken.UserId,
                    couponCode,
                });
                yield sendEmail({
                    organizationTitle,
                    inviterName: inviterUser.userId.personalDetails.name,
                    inviteeHasAccount: false,
                    joinLink,
                    [languageCode(language)]: true,
                }, inviteeEmail, TEMPLATES.ORGANIZATIONS.INVITE_TO_INVITEE);
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createPendingInvite',
                functionParams: [
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'inviterUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'inviteeEmail',
                        paramValue: inviteeEmail,
                        paramType: typeof inviteeEmail,
                    },
                ],
                additionalMessage: 'Created Invite Successfully',
                startLogId,
            });
            return {
                message: 'Created Invite Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingInvite',
                    functionParams: [
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
                        },
                        {
                            paramName: 'organizationTitle',
                            paramValue: organizationTitle,
                            paramType: typeof organizationTitle,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'inviteeEmail',
                            paramValue: inviteeEmail,
                            paramType: typeof inviteeEmail,
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
                functionName: 'createPendingInvite',
                functionParams: [
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'inviterUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'inviteeEmail',
                        paramValue: inviteeEmail,
                        paramType: typeof inviteeEmail,
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
//# sourceMappingURL=createPendingInvite.js.map