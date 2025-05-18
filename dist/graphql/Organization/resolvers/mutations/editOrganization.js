var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function editOrganization(parent, { organizationData, documentId, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'editOrganization',
                functionParams: [
                    {
                        paramName: 'organizationData',
                        paramValue: organizationData,
                        paramType: typeof organizationData,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
            const { restrictionLevel, title, slug, headline, description, image, website, supportEmail, supportPhone, location, socials, verified, searchTags, media, isPrivate, publicFeatures, } = organizationData;
            const hasEditPermission = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: documentId,
                role: { $in: ['owner', 'admin'] },
            });
            if (!hasEditPermission) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrganization',
                    functionParams: [
                        {
                            paramName: 'organizationData',
                            paramValue: organizationData,
                            paramType: typeof organizationData,
                        },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
                    additionalMessage: 'Not Authenticated: User Lacks Edit Permissions',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            if (title) {
                const safeOrgTitle = escapeStringRegexp(title);
                const pattern = `^${safeOrgTitle}$`;
                const orgTitleRegex = new RegExp(pattern, 'i');
                const existingTitle = yield Organization.exists({
                    title: { $regex: orgTitleRegex },
                    _id: { $ne: documentId },
                });
                if (existingTitle) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'editOrganization',
                        functionParams: [
                            {
                                paramName: 'organizationData',
                                paramValue: organizationData,
                                paramType: typeof organizationData,
                            },
                            {
                                paramName: 'documentId',
                                paramValue: documentId,
                                paramType: typeof documentId,
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
                        additionalMessage: 'Duplicate Title',
                        startLogId,
                    });
                    return {
                        message: 'Organization Title Already In Use',
                        status: 409,
                    };
                }
            }
            if (slug) {
                const safeSlug = escapeStringRegexp(slug);
                const slugPattern = `^${safeSlug}$`;
                const slugRegex = new RegExp(slugPattern, 'i');
                const existingSlug = yield Organization.exists({
                    slug: { $regex: slugRegex },
                    _id: { $ne: documentId },
                });
                if (existingSlug) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'editOrganization',
                        functionParams: [
                            {
                                paramName: 'organizationData',
                                paramValue: organizationData,
                                paramType: typeof organizationData,
                            },
                            {
                                paramName: 'documentId',
                                paramValue: documentId,
                                paramType: typeof documentId,
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
                        additionalMessage: 'Duplicate Slug',
                        startLogId,
                    });
                    return {
                        message: 'Organization Slug Already In Use',
                        status: 409,
                    };
                }
            }
            const updatedOrganization = yield Organization.findByIdAndUpdate(documentId, {
                restrictionLevel,
                title,
                slug,
                headline,
                description,
                image,
                website,
                supportEmail,
                supportPhone,
                location,
                'socials.twitter': socials === null || socials === void 0 ? void 0 : socials.twitter,
                'socials.instagram': socials === null || socials === void 0 ? void 0 : socials.instagram,
                'socials.linkedin': socials === null || socials === void 0 ? void 0 : socials.linkedin,
                'socials.facebook': socials === null || socials === void 0 ? void 0 : socials.facebook,
                'socials.youtube': socials === null || socials === void 0 ? void 0 : socials.youtube,
                verified,
                searchTags,
                'media.type': media === null || media === void 0 ? void 0 : media.type,
                'media.link': media === null || media === void 0 ? void 0 : media.link,
                isPrivate,
                publicFeatures,
            }, { runValidators: true })
                .orFail(() => new Error('Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'editOrganization',
                functionParams: [
                    {
                        paramName: 'organizationData',
                        paramValue: organizationData,
                        paramType: typeof organizationData,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
                additionalMessage: 'Updated Organization Successfully',
                startLogId,
            });
            return {
                message: 'Updated Organization Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrganization',
                    functionParams: [
                        {
                            paramName: 'organizationData',
                            paramValue: organizationData,
                            paramType: typeof organizationData,
                        },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Organization validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrganization',
                    functionParams: [
                        {
                            paramName: 'organizationData',
                            paramValue: organizationData,
                            paramType: typeof organizationData,
                        },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
                    additionalMessage: 'Mongoose Organization Validation Failed',
                    startLogId,
                });
                return {
                    message: err.message,
                    status: 400,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'editOrganization',
                functionParams: [
                    {
                        paramName: 'organizationData',
                        paramValue: organizationData,
                        paramType: typeof organizationData,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
//# sourceMappingURL=editOrganization.js.map