var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import escapeStringRegexp from 'escape-string-regexp';
import jwt from 'jsonwebtoken';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import cuid from 'cuid';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function generateInviteLink(parent, { token, inviteeEmail, inviteeName }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'generateInviteLink',
                functionParams: [
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
                    {
                        paramName: 'inviteeName',
                        paramValue: inviteeName,
                        paramType: typeof inviteeName,
                    },
                ],
            });
            const safeInviteeEmail = escapeStringRegexp(inviteeEmail);
            const pattern = `^${safeInviteeEmail}$`;
            const inviteeEmailRegex = new RegExp(pattern, 'i');
            const inviteeUser = yield User.exists({
                'accountDetails.email': { $regex: inviteeEmailRegex },
            });
            if (inviteeUser) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'generateInviteLink',
                    functionParams: [
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
                        {
                            paramName: 'inviteeName',
                            paramValue: inviteeName,
                            paramType: typeof inviteeName,
                        },
                    ],
                    additionalMessage: 'User already has an account',
                    startLogId,
                });
                return {
                    message: 'User already has an account',
                    status: 409,
                };
            }
            const existingInvite = yield PendingInvite.exists({
                inviteeEmail: { $regex: inviteeEmailRegex },
            });
            if (existingInvite) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'generateInviteLink',
                    functionParams: [
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
                        {
                            paramName: 'inviteeName',
                            paramValue: inviteeName,
                            paramType: typeof inviteeName,
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
            const couponCode = cuid.slug();
            const joinLink = `https://30mins.com/join?code=${couponCode}`;
            yield PendingInvite.create({
                inviteeEmail,
                inviteeName,
                inviterUserId: decodedToken.UserId,
                couponCode,
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'generateInviteLink',
                functionParams: [
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
                    {
                        paramName: 'inviteeName',
                        paramValue: inviteeName,
                        paramType: typeof inviteeName,
                    },
                ],
                additionalMessage: `Created Invite Successfully: ${joinLink}`,
                startLogId,
            });
            return {
                message: joinLink,
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'generateInviteLink',
                    functionParams: [
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
                        {
                            paramName: 'inviteeName',
                            paramValue: inviteeName,
                            paramType: typeof inviteeName,
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
                functionName: 'generateInviteLink',
                functionParams: [
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
                    {
                        paramName: 'inviteeName',
                        paramValue: inviteeName,
                        paramType: typeof inviteeName,
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
//# sourceMappingURL=generateInviteLink.js.map