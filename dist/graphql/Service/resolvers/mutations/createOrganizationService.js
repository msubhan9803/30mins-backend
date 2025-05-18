var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { PAYMENT_TYPES } from '../../../../constants/enums';
export default function createOrganizationService(parent, { organizationServiceData, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createOrganizationService',
                functionParams: [
                    {
                        paramName: 'organizationServiceData',
                        paramValue: organizationServiceData,
                        paramType: typeof organizationServiceData,
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
            const { title, slug, description, image, duration, isPrivate, price, currency, percentDonated, charity, reminders, recurringInterval, isRecurring, conferenceType, searchTags, media, paymentType, isPaid, isOrgService, organizationId, organizationName, orgServiceCategory, serviceWorkingHours, bookingQuestions, emailFilter, serviceType, blackList, whiteList, otpProtected, authenticationType, } = organizationServiceData;
            if (isPaid && currency !== '$' && paymentType === PAYMENT_TYPES.ESCROW) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
                    additionalMessage: 'Escrow Only Supports USD Currency',
                    startLogId,
                });
                return {
                    message: 'Escrow Only Supports USD Currency',
                    status: 400,
                };
            }
            const userInOrg = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
            });
            if (!userInOrg) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
                    additionalMessage: 'User not in Organization',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const safeSlug = escapeStringRegexp(slug);
            const pattern = `^${safeSlug}$`;
            const regex = new RegExp(pattern, 'i');
            const dupeSlug = yield Service.exists({
                userId: decodedToken.UserId,
                slug: { $regex: regex },
            });
            if (dupeSlug) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
                    message: 'Duplicate Slug',
                    status: 409,
                };
            }
            const createdService = yield Service.create({
                userId: decodedToken.UserId,
                title,
                slug,
                image,
                description,
                duration,
                isPrivate,
                price,
                currency,
                percentDonated: paymentType !== PAYMENT_TYPES.MANUAL ? percentDonated : undefined,
                charity: paymentType !== PAYMENT_TYPES.MANUAL ? charity : undefined,
                reminders,
                isRecurring,
                recurringInterval,
                conferenceType,
                searchTags,
                'media.type': media === null || media === void 0 ? void 0 : media.type,
                'media.link': media === null || media === void 0 ? void 0 : media.link,
                paymentType: isPaid ? paymentType : undefined,
                isPaid,
                isOrgService,
                organizationId,
                organizationName,
                orgServiceCategory,
                serviceWorkingHours,
                bookingQuestions,
                emailFilter,
                serviceType,
                blackList,
                whiteList,
                otpProtected,
                authenticationType,
            });
            const updatedUser = yield User.findByIdAndUpdate(decodedToken.UserId, {
                $push: {
                    services: createdService._id,
                },
            })
                .orFail(() => new Error('User Document Not Found'))
                .exec();
            const updatedOrganization = yield Organization.findByIdAndUpdate(organizationId, {
                $push: {
                    services: createdService._id,
                },
            })
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createOrganizationService',
                functionParams: [
                    {
                        paramName: 'organizationServiceData',
                        paramValue: organizationServiceData,
                        paramType: typeof organizationServiceData,
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
                additionalMessage: 'Organization Service Created Successfully',
                startLogId,
            });
            return {
                message: 'Organization Service Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Service validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
                    additionalMessage: 'Mongoose Service Validation Failed',
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
                functionName: 'createOrganizationService',
                functionParams: [
                    {
                        paramName: 'organizationServiceData',
                        paramValue: organizationServiceData,
                        paramType: typeof organizationServiceData,
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
//# sourceMappingURL=createOrganizationService.js.map