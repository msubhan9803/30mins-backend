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
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { PAYMENT_TYPES } from '../../../../constants/enums';
export default function editOrganizationService(parent, { organizationServiceData, documentId, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'editOrganizationService',
                functionParams: [
                    {
                        paramName: 'organizationServiceData',
                        paramValue: organizationServiceData,
                        paramType: typeof organizationServiceData,
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
            const { title, slug, description, image, duration, isPrivate, price, currency, percentDonated, charity, reminders, recurringInterval, isRecurring, conferenceType, searchTags, media, paymentType, isPaid, isOrgService, organizationId, organizationName, orgServiceCategory, serviceWorkingHours, bookingQuestions, emailFilter, serviceType, blackList, whiteList, otpProtected, authenticationType, } = organizationServiceData;
            if (isPaid && currency !== '$' && paymentType === PAYMENT_TYPES.ESCROW) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
                    additionalMessage: 'Escrow Only Supports USD Currency',
                    startLogId,
                });
                return {
                    message: 'Escrow Only Supports USD Currency',
                    status: 400,
                };
            }
            const safeSlug = escapeStringRegexp(slug);
            const pattern = `^${safeSlug}$`;
            const regex = new RegExp(pattern, 'i');
            const dupeSlug = yield Service.exists({
                _id: { $ne: documentId },
                userId: decodedToken.UserId,
                slug: { $regex: regex },
            });
            if (dupeSlug) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
            const updatedService = yield Service.findOneAndUpdate({
                userId: decodedToken.UserId,
                _id: documentId,
            }, {
                $set: {
                    title,
                    slug,
                    description,
                    duration,
                    image,
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
                    otpProtected,
                    whiteList,
                    authenticationType,
                },
            }, { runValidators: true })
                .orFail(() => new Error('Organization Service Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'editOrganizationService',
                functionParams: [
                    {
                        paramName: 'organizationServiceData',
                        paramValue: organizationServiceData,
                        paramType: typeof organizationServiceData,
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
                additionalMessage: 'Organization Service Updated Successfully',
                startLogId,
            });
            return {
                message: 'Organization Service Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
                    functionName: 'editOrganizationService',
                    functionParams: [
                        {
                            paramName: 'organizationServiceData',
                            paramValue: organizationServiceData,
                            paramType: typeof organizationServiceData,
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
                functionName: 'editOrganizationService',
                functionParams: [
                    {
                        paramName: 'organizationServiceData',
                        paramValue: organizationServiceData,
                        paramType: typeof organizationServiceData,
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
//# sourceMappingURL=editOrganizationService.js.map