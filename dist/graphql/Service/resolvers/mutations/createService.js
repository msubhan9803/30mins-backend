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
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { PAYMENT_TYPES, SERVICE_TYPES } from '../../../../constants/enums';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
export default function createService(parent, { serviceData, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createService',
                functionParams: [
                    {
                        paramName: 'createService',
                        paramValue: serviceData,
                        paramType: typeof serviceData,
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
            const { title, slug, image, description, duration, isPrivate, price, currency, percentDonated, charity, charityId, reminders, recurringInterval, isRecurring, conferenceType, searchTags, media, paymentType, isPaid, serviceWorkingHours, serviceAvailability, bookingQuestions, emailFilter, serviceType, attendeeLimit, blackList, whiteList, dueDate, otpProtected, authenticationType, } = serviceData;
            const hasPaidMeetingExtension = yield ActiveExtension.exists({
                userId: decodedToken.UserId,
                extensionProductId: {
                    $in: [stripeProductIDs.EXTENSIONS.PAID_MEETINGS],
                },
                status: {
                    $in: ['paid', 'gifted'],
                },
            });
            if ((price > 0 || isPaid) &&
                !hasPaidMeetingExtension &&
                serviceType === SERVICE_TYPES.MEETING) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createService',
                    functionParams: [
                        {
                            paramName: 'serviceData',
                            paramValue: serviceData,
                            paramType: typeof serviceData,
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
                    additionalMessage: 'Missing Paid Meeting Extension',
                    startLogId,
                });
                return {
                    message: 'Missing Paid Meeting Extension',
                    status: 400,
                };
            }
            if (isPaid && currency !== '$' && paymentType === PAYMENT_TYPES.ESCROW) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createService',
                    functionParams: [
                        {
                            paramName: 'serviceData',
                            paramValue: serviceData,
                            paramType: typeof serviceData,
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
                userId: decodedToken.UserId,
                slug: { $regex: regex },
            });
            if (dupeSlug) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createService',
                    functionParams: [
                        {
                            paramName: 'serviceData',
                            paramValue: serviceData,
                            paramType: typeof serviceData,
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
                    additionalMessage: 'This slug is being used by another service currently.',
                    startLogId,
                });
                return {
                    message: 'This slug is being used by another service currently.',
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
                percentDonated: percentDonated ? percentDonated : undefined,
                charity: charity ? charity : undefined,
                charityId: charityId ? charityId : undefined,
                reminders,
                isRecurring,
                recurringInterval,
                conferenceType,
                searchTags,
                'media.type': media === null || media === void 0 ? void 0 : media.type,
                'media.link': media === null || media === void 0 ? void 0 : media.link,
                paymentType: isPaid ? paymentType : 'none',
                isPaid,
                serviceWorkingHours,
                serviceAvailability,
                bookingQuestions,
                emailFilter,
                serviceType,
                attendeeLimit,
                blackList,
                whiteList,
                dueDate,
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
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createService',
                functionParams: [
                    {
                        paramName: 'serviceData',
                        paramValue: serviceData,
                        paramType: typeof serviceData,
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
                additionalMessage: 'Service Created Successfully',
                startLogId,
            });
            return {
                message: 'Service Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createService',
                    functionParams: [
                        {
                            paramName: 'serviceData',
                            paramValue: serviceData,
                            paramType: typeof serviceData,
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
                    functionName: 'createService',
                    functionParams: [
                        {
                            paramName: 'serviceData',
                            paramValue: serviceData,
                            paramType: typeof serviceData,
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
                functionName: 'createService',
                functionParams: [
                    {
                        paramName: 'serviceData',
                        paramValue: serviceData,
                        paramType: typeof serviceData,
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
//# sourceMappingURL=createService.js.map