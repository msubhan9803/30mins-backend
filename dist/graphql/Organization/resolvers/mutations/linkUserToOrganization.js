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
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import jwt from 'jsonwebtoken';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function linkUserToOrganization(parent, { organizationTitle, userEmail }, context, info) {
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
                functionName: 'linkUserToOrganization',
                functionParams: [
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: 'userEmail',
                        paramType: typeof userEmail,
                    },
                ],
            });
            const isMarketer = yield User.exists({
                _id: decodedToken.UserId,
                isMarketer: true,
            });
            if (!isMarketer) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerCreateOrganization',
                    functionParams: [
                        {
                            paramName: 'marketerId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'organizationTitle',
                            paramValue: organizationTitle,
                            paramType: typeof organizationTitle,
                        },
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
            const safeOrgTitle = escapeStringRegexp(organizationTitle);
            const titlePattern = `^${safeOrgTitle}$`;
            const orgTitleRegex = new RegExp(titlePattern, 'i');
            const user = yield User.findOne({
                $or: [
                    { 'accountDetails.email': { $regex: emailRegex } },
                    { 'accountDetails.username': { $regex: emailRegex } },
                ],
            })
                .orFail(() => new Error('User Document Not Found'))
                .exec();
            const organization = yield Organization.findOne({ title: { $regex: orgTitleRegex } })
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            const existingMembership = yield OrganizationMembership.exists({
                userId: user._id,
                organizationId: organization._id,
            });
            if (existingMembership) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'linkUserToOrganization',
                    functionParams: [
                        {
                            paramName: 'organizationTitle',
                            paramValue: organizationTitle,
                            paramType: typeof organizationTitle,
                        },
                        {
                            paramName: 'userEmail',
                            paramValue: 'userEmail',
                            paramType: typeof userEmail,
                        },
                    ],
                    additionalMessage: 'User is Already a Member of this Organization',
                });
                return {
                    message: 'User is Already a Member of this Organization',
                    status: 409,
                };
            }
            const createdMembership = yield OrganizationMembership.create({
                userId: user._id,
                organizationId: organization._id,
                role: 'owner',
            });
            yield Organization.findByIdAndUpdate(organization._id, {
                $push: {
                    members: createdMembership.userId,
                },
            }).exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'linkUserToOrganization',
                functionParams: [
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: 'userEmail',
                        paramType: typeof userEmail,
                    },
                ],
                additionalMessage: 'User Linked Successfully',
                startLogId,
            });
            return {
                message: 'User Linked Successfully',
                status: 200,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'linkUserToOrganization',
                functionParams: [
                    {
                        paramName: 'organizationTitle',
                        paramValue: organizationTitle,
                        paramType: typeof organizationTitle,
                    },
                    {
                        paramName: 'userEmail',
                        paramValue: 'userEmail',
                        paramType: typeof userEmail,
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
//# sourceMappingURL=linkUserToOrganization.js.map