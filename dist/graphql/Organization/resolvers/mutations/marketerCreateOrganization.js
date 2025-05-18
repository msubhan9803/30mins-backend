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
import Organization from '../../../../MongoModels/Organization';
import escapeStringRegexp from 'escape-string-regexp';
export default function marketerCreateOrganization(parent, { organizationData }, context) {
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
                functionName: 'marketerCreateOrganization',
                functionParams: [
                    {
                        paramName: 'marketerId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'organizationData',
                        paramValue: organizationData,
                        paramType: typeof organizationData,
                    },
                ],
            });
            const marketerUser = yield User.findOne({
                _id: decodedToken.UserId,
                isMarketer: true,
            });
            if (!marketerUser) {
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
                            paramName: 'organizationData',
                            paramValue: organizationData,
                            paramType: typeof organizationData,
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
            const safeOrgTitle = escapeStringRegexp(organizationData.title);
            const pattern = `^${safeOrgTitle}$`;
            const orgTitleRegex = new RegExp(pattern, 'i');
            const existingTitle = yield Organization.exists({
                title: { $regex: orgTitleRegex },
            });
            if (existingTitle) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerCreateOrganization',
                    functionParams: [
                        {
                            paramName: 'organizationData',
                            paramValue: organizationData,
                            paramType: typeof organizationData,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'marketerId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Duplicate Title',
                    startLogId,
                });
                return {
                    message: 'Organization Title Already In Use',
                    status: 409,
                };
            }
            const safeSlug = escapeStringRegexp(organizationData.slug);
            const slugPattern = `^${safeSlug}$`;
            const slugRegex = new RegExp(slugPattern, 'i');
            const existingSlug = yield Organization.exists({
                slug: { $regex: slugRegex },
            });
            if (existingSlug) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerCreateOrganization',
                    functionParams: [
                        {
                            paramName: 'organizationData',
                            paramValue: organizationData,
                            paramType: typeof organizationData,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'marketerId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Duplicate Slug',
                    startLogId,
                });
                return {
                    message: 'Organization Slug Already In Use',
                    status: 409,
                };
            }
            yield Organization.create({
                title: organizationData.title,
                slug: organizationData.slug,
                image: organizationData.image,
                website: organizationData.website,
                localtion: organizationData.localtion,
                headline: organizationData.headline,
                description: organizationData.description,
                createdBy: decodedToken.UserId,
                affiliateTeamCreatedBy: (marketerUser === null || marketerUser === void 0 ? void 0 : marketerUser.affiliateTeam) || '',
                restrictionLevel: 'OPEN',
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'marketerCreateOrganization',
                functionParams: [
                    {
                        paramName: 'marketerId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'organizationData',
                        paramValue: organizationData,
                        paramType: typeof organizationData,
                    },
                ],
                additionalMessage: 'Organization Created Successfully',
                startLogId,
            });
            return {
                message: 'Organization Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerCreateOrganization',
                    functionParams: [
                        {
                            paramName: 'organizationData',
                            paramValue: organizationData,
                            paramType: typeof organizationData,
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
                functionName: 'marketerCreateOrganization',
                functionParams: [
                    {
                        paramName: 'organizationData',
                        paramValue: organizationData,
                        paramType: typeof organizationData,
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
//# sourceMappingURL=marketerCreateOrganization.js.map