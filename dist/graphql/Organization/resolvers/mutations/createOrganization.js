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
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import StatisticsProcessingQueue from '../../../../MongoModels/StatisticsProcessingQueue';
import dayjs from 'dayjs';
export default function createOrganization(parent, { organizationData, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createOrganization',
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
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const hasExtension = yield ActiveExtension.exists({
                userId: decodedToken.UserId,
                extensionProductId: {
                    $in: [
                        stripeProductIDs.EXTENSIONS.ORGANIZATIONS,
                        stripeProductIDs.EXTENSIONS.ORGANIZATIONS_ANNUAL,
                    ],
                },
                status: {
                    $in: ['paid', 'gifted'],
                },
            });
            if (!hasExtension) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganization',
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
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'User does not have the Organization Extension',
                    startLogId,
                });
                return {
                    message: 'User does not have the Organization Extension',
                    status: 400,
                };
            }
            const { restrictionLevel, title, slug, headline, description, image, website, supportEmail, supportPhone, location, socials, verified, searchTags, media, isPrivate, publicFeatures, } = organizationData;
            const safeOrgTitle = escapeStringRegexp(title);
            const pattern = `^${safeOrgTitle}$`;
            const orgTitleRegex = new RegExp(pattern, 'i');
            const existingTitle = yield Organization.exists({ title: { $regex: orgTitleRegex } });
            if (existingTitle) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganization',
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
            const safeSlug = escapeStringRegexp(slug);
            const slugPattern = `^${safeSlug}$`;
            const slugRegex = new RegExp(slugPattern, 'i');
            const existingSlug = yield Organization.exists({ slug: { $regex: slugRegex } });
            if (existingSlug) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganization',
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
            const createdOrganization = yield Organization.create({
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
                serviceCategories: ['default'],
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
            });
            const organizationId = createdOrganization._id.valueOf();
            const ownerMembership = yield OrganizationMembership.create({
                userId: decodedToken.UserId,
                organizationId: organizationId,
                role: 'owner',
            });
            createdOrganization.members = [ownerMembership.userId];
            yield createdOrganization.save();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createOrganization',
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
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Created Organization Successfully',
                startLogId,
            });
            yield StatisticsProcessingQueue.create({
                schemaName: 'GlobalBussiness',
                fields: {
                    totalOrganizationsSignedUp: 1,
                },
                timeStamp: dayjs().toISOString(),
            });
            return {
                message: 'Created Organization Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganization',
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
                    functionName: 'createOrganization',
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
                functionName: 'createOrganization',
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
//# sourceMappingURL=createOrganization.js.map