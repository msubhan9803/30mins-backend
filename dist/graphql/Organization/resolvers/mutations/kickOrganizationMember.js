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
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { LANGUAGES } from '../../../../constants/enums';
export default function kickOrganizationMember(parent, { token, organizationMembershipId, organizationId, kickReason }, context, info) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'kickOrganizationMember',
                functionParams: [
                    {
                        paramName: 'organizationMembershipId',
                        paramValue: organizationMembershipId,
                        paramType: typeof organizationMembershipId,
                    },
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const hasKickPermission = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
                role: { $in: ['owner', 'admin'] },
            });
            if (!hasKickPermission) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'kickOrganizationMember',
                    functionParams: [
                        {
                            paramName: 'organizationMembershipId',
                            paramValue: organizationMembershipId,
                            paramType: typeof organizationMembershipId,
                        },
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Not Authenticated: User Lacks Kick Permissions',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const deletedMembership = yield OrganizationMembership.findOneAndDelete({
                _id: organizationMembershipId,
                organizationId,
            })
                .orFail(() => new Error('Organization Membership Document Not Found'))
                .exec();
            const updatedOrganization = yield Organization.findByIdAndUpdate(organizationId, {
                $pull: {
                    members: deletedMembership.userId,
                },
            })
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            const deletedServices = yield Service.deleteMany({
                _id: deletedMembership.userId,
                organizationId,
            }).exec();
            const currentOrganization = yield Organization.findById({
                _id: organizationId,
            })
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            const kickedMember = yield User.findById({
                _id: deletedMembership === null || deletedMembership === void 0 ? void 0 : deletedMembership.userId,
            })
                .orFail(() => new Error('User Document Not Found'))
                .exec();
            yield sendEmail({
                orgName: currentOrganization === null || currentOrganization === void 0 ? void 0 : currentOrganization.title,
                memberName: (_a = kickedMember === null || kickedMember === void 0 ? void 0 : kickedMember.personalDetails) === null || _a === void 0 ? void 0 : _a.name,
                kickReason,
                [languageCode(((_b = kickedMember === null || kickedMember === void 0 ? void 0 : kickedMember.personalDetails) === null || _b === void 0 ? void 0 : _b.language) || LANGUAGES.ENGLISH)]: true,
            }, (_c = kickedMember === null || kickedMember === void 0 ? void 0 : kickedMember.accountDetails) === null || _c === void 0 ? void 0 : _c.email, TEMPLATES.OUTREACH.KICK_ORG_MEMBER);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'kickOrganizationMember',
                functionParams: [
                    {
                        paramName: 'organizationMembershipId',
                        paramValue: organizationMembershipId,
                        paramType: typeof organizationMembershipId,
                    },
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Organization Member Removed Successfully',
                startLogId,
            });
            return {
                message: 'Organization Member Removed Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'kickOrganizationMember',
                    functionParams: [
                        {
                            paramName: 'organizationMembershipId',
                            paramValue: organizationMembershipId,
                            paramType: typeof organizationMembershipId,
                        },
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
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
                functionName: 'kickOrganizationMember',
                functionParams: [
                    {
                        paramName: 'organizationMembershipId',
                        paramValue: organizationMembershipId,
                        paramType: typeof organizationMembershipId,
                    },
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
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
//# sourceMappingURL=kickOrganizationMember.js.map