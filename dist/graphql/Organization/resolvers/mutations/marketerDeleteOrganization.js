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
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import PendingJoinRequest from '../../../../MongoModels/PendingJoinRequest';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import escapeStringRegexp from 'escape-string-regexp';
export default function marketerDeleteOrganization(parent, { organizationTitle }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        let decodedToken;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
            decodedToken = jwt.verify(context.token, accessTokenSecret);
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'marketerDeleteOrganization',
                functionParams: [
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: { message: 'Not Authorized', status: 401 },
            };
        }
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'marketerDeleteOrganization',
                functionParams: [
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const marketingUser = yield User.findOne({
                _id: decodedToken.UserId,
                isMarketer: true,
            });
            if (!marketingUser) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerDeleteOrganization',
                    functionParams: [
                        {
                            paramName: 'organizationTitle',
                            paramValue: organizationTitle,
                            paramType: typeof organizationTitle,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
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
            const safeTitle = escapeStringRegexp(organizationTitle);
            const titlePattern = `^${safeTitle}$`;
            const titleRegex = new RegExp(titlePattern, 'i');
            const deletedOrganization = yield Organization.findOneAndDelete({
                title: { $regex: titleRegex },
                $or: [{ createdBy: marketingUser._id }, { affiliateTeamCreatedBy: marketingUser.affiliateTeam }],
            });
            yield OrganizationMembership.deleteMany({ organizationId: deletedOrganization._id });
            yield PendingInvite.deleteMany({ organizationId: deletedOrganization._id });
            yield PendingJoinRequest.deleteMany({ organizationId: deletedOrganization._id });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'marketerDeleteOrganization',
                functionParams: [
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Organization Deleted Successfully',
                startLogId,
            });
            return {
                message: 'Organization Deleted Successfully',
                status: 200,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'marketerDeleteOrganization',
                functionParams: [
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
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
//# sourceMappingURL=marketerDeleteOrganization.js.map