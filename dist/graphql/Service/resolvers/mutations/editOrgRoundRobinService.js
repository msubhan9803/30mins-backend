var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SERVICE_TYPES } from '../../../../constants/enums';
import Service from '../../../../MongoModels/Service';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
export default function editOrgRoundRobinService(parent, { roundRobinServiceData, documentId }, context, _info) {
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
                functionName: 'editOrgRoundRobinService',
                functionParams: [
                    {
                        paramName: 'roundRobinServiceData',
                        paramValue: roundRobinServiceData,
                        paramType: typeof roundRobinServiceData,
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
            const { title, slug, description, image, duration, price, currency, reminders, recurringInterval, isRecurring, conferenceType, searchTags, media, isOrgService, organizationId, organizationName, orgServiceCategory, serviceWorkingHours, bookingQuestions, blackList, whiteList, roundRobinTeam, authenticationType, otpProtected, } = roundRobinServiceData;
            if (roundRobinTeam) {
                const roundRobinExist = yield RoundRobinTeam.exists({
                    _id: roundRobinTeam,
                    organizationId: organizationId,
                });
                if (!roundRobinExist) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_START,
                        level: ApiLogLevels.ERROR,
                        functionName: 'editOrgRoundRobinService',
                        functionParams: [
                            {
                                paramName: 'roundRobinServiceData',
                                paramValue: roundRobinServiceData,
                                paramType: typeof roundRobinServiceData,
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
                        additionalMessage: 'The round robin team does not exist',
                        startLogId,
                    });
                    return {
                        message: 'The round robin team does not exist',
                        status: 401,
                    };
                }
            }
            const hasPermission = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
                role: { $in: ['admin', 'owner'] },
            });
            if (!hasPermission) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_START,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
                    additionalMessage: 'The user is neither in Organization nor Admin',
                    startLogId,
                });
                return {
                    message: 'The user is neither in Organization nor Admin',
                    status: 401,
                };
            }
            const safeSlug = escapeStringRegexp(slug);
            const pattern = `^${safeSlug}$`;
            const regex = new RegExp(pattern, 'i');
            const dupeSlug = yield Service.exists({
                _id: { $ne: documentId },
                organizationId: organizationId,
                slug: { $regex: regex },
            });
            if (dupeSlug) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
                    message: 'Duplicate Slug',
                    status: 409,
                };
            }
            const isValidService = yield Service.exists({
                _id: documentId,
                organizationId: organizationId,
                serviceType: SERVICE_TYPES.ROUND_ROBIN,
            });
            if (!isValidService) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_START,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
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
                    additionalMessage: 'Invalid Service!',
                    startLogId,
                });
                return {
                    message: 'Invalid Service!',
                    status: 401,
                };
            }
            yield Service.findByIdAndUpdate(documentId, {
                $set: {
                    title,
                    slug,
                    description,
                    duration,
                    image,
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
                    otpProtected,
                    roundRobinTeam,
                    authenticationType,
                },
            }, { runValidators: true }).orFail(() => new Error('Organization Service Document Not Found'));
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'editOrgRoundRobinService',
                functionParams: [
                    {
                        paramName: 'roundRobinServiceData',
                        paramValue: roundRobinServiceData,
                        paramType: typeof roundRobinServiceData,
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
                additionalMessage: 'Round Robin Organization Service Updated Successfully',
                startLogId,
            });
            return {
                message: 'Round Robin Organization Service Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Service validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrgRoundRobinService',
                    functionParams: [
                        {
                            paramName: 'roundRobinServiceData',
                            paramValue: roundRobinServiceData,
                            paramType: typeof roundRobinServiceData,
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
                functionName: 'editOrgRoundRobinService',
                functionParams: [
                    {
                        paramName: 'roundRobinServiceData',
                        paramValue: roundRobinServiceData,
                        paramType: typeof roundRobinServiceData,
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
//# sourceMappingURL=editOrgRoundRobinService.js.map