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
import { SERVICE_TYPES } from '../../../../constants/enums';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
export default function createOrgRoundRobinService(parent, { roundRobinServiceData }, context, _info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createOrgRoundRobinService',
                functionParams: [
                    {
                        paramName: 'roundRobinServiceData',
                        paramValue: roundRobinServiceData,
                        paramType: typeof roundRobinServiceData,
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
            const { title, slug, description, image, duration, price, currency, reminders, recurringInterval, isRecurring, conferenceType, searchTags, media, isOrgService, organizationId, organizationName, orgServiceCategory, serviceWorkingHours, bookingQuestions, blackList, whiteList, roundRobinTeam, otpProtected, authenticationType, } = roundRobinServiceData;
            const hasPermission = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
                role: { $in: ['owner', 'admin'] },
            });
            if (!hasPermission) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
                    additionalMessage: 'Not Authenticated:  The user does not have the create permission',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated: The user does not have the create permission',
                    status: 401,
                };
            }
            if (roundRobinTeam) {
                const roundRobinExist = yield RoundRobinTeam.exists({
                    _id: roundRobinTeam,
                    organizationId: organizationId,
                });
                if (!roundRobinExist) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_START,
                        level: ApiLogLevels.ERROR,
                        functionName: 'createOrgRoundRobinService',
                        functionParams: [
                            {
                                paramName: 'roundRobinServiceData',
                                paramValue: roundRobinServiceData,
                                paramType: typeof roundRobinServiceData,
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
                        additionalMessage: 'The round robin team does not exist',
                        startLogId,
                    });
                    return {
                        message: 'The round robin team does not exist',
                        status: 401,
                    };
                }
            }
            const userInOrg = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
            });
            if (!userInOrg) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
                    additionalMessage: 'User is not in Organization',
                    startLogId,
                });
                return {
                    message: 'User is not in Organization',
                    status: 401,
                };
            }
            const safeSlug = escapeStringRegexp(slug);
            const pattern = `^${safeSlug}$`;
            const regex = new RegExp(pattern, 'i');
            const dupeSlug = yield Service.exists({
                organizationId: organizationId,
                slug: { $regex: regex },
            });
            if (dupeSlug) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
                isPrivate: !roundRobinTeam ? true : false,
                price,
                currency,
                percentDonated: undefined,
                charity: undefined,
                reminders,
                isRecurring,
                recurringInterval,
                conferenceType,
                searchTags,
                'media.type': media === null || media === void 0 ? void 0 : media.type,
                'media.link': media === null || media === void 0 ? void 0 : media.link,
                paymentType: undefined,
                isPaid: false,
                isOrgService,
                organizationId,
                organizationName,
                orgServiceCategory,
                serviceWorkingHours,
                bookingQuestions,
                blackList,
                whiteList,
                roundRobinTeam,
                otpProtected,
                authenticationType,
                serviceType: SERVICE_TYPES.ROUND_ROBIN,
            });
            yield User.findByIdAndUpdate(decodedToken.UserId, {
                $push: {
                    services: createdService._id,
                },
            }).orFail(() => new Error('User Document Not Found'));
            yield Organization.findByIdAndUpdate(organizationId, {
                $push: {
                    services: createdService._id,
                },
            }).orFail(() => new Error('Organization Document Not Found'));
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createOrgRoundRobinService',
                functionParams: [
                    {
                        paramName: 'roundRobinServiceData',
                        paramValue: roundRobinServiceData,
                        paramType: typeof roundRobinServiceData,
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
                additionalMessage: 'Organization Round Robin Service Created Successfully',
                startLogId,
            });
            return {
                message: 'Round Robin Organization Service Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
                    functionName: 'createOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
                functionName: 'createOrgRoundRobinService',
                functionParams: [
                    {
                        paramName: 'roundRobinServiceData',
                        paramValue: roundRobinServiceData,
                        paramType: typeof roundRobinServiceData,
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
//# sourceMappingURL=createOrgRoundRobinService.js.map