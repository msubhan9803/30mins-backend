var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import BookingApprovals from '../../../../MongoModels/BookingApprovals';
import dayjs from 'dayjs';
import Service from '../../../../MongoModels/Service';
export default function RequestBookingAllow(_, { authcode }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId = '';
        const { token } = context;
        const functionParams = [
            {
                paramName: 'authcode',
                paramValue: authcode,
                paramType: typeof authcode,
            },
            {
                paramName: 'token',
                paramValue: 'HIDDEN_TOKEN',
                paramType: typeof token,
            },
        ];
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'RequestBookingAllow',
                functionParams: functionParams,
                additionalMessage: 'Starting Mutation',
            });
            const SECRETS = yield AwsSecrets.getInstance();
            if (token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'RequestBookingAllow',
                    functionParams: functionParams,
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const bookingApproval = yield BookingApprovals.findOne({
                authcode: authcode,
            });
            if (!bookingApproval) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'RequestBookingAllow',
                    functionParams: functionParams,
                    additionalMessage: 'Approval Request Not Found.',
                    startLogId,
                });
                return {
                    response: {
                        status: 404,
                        message: 'Approval Request Not Found.',
                    },
                };
            }
            if (dayjs().isAfter(dayjs(bookingApproval.createdAt).add(2, 'day'), 'day')) {
                yield BookingApprovals.deleteOne({
                    authcode: authcode,
                });
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'RequestBookingAllow',
                    functionParams: functionParams,
                    additionalMessage: 'Three days have been passed. Action is not permitted.',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Three days have been passed. Action is not permitted.',
                        status: 400,
                    },
                };
            }
            if (bookingApproval.denied) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'RequestBookingAllow',
                    functionParams: functionParams,
                    additionalMessage: 'Booker has been previously denied access. Wait 24 hours and then initiate the request again.',
                    startLogId,
                });
                return {
                    response: {
                        status: 400,
                        message: 'Booker has been previously denied access. Wait 24 hours and then initiate the request again.',
                    },
                };
            }
            if (!dayjs().isAfter(dayjs(bookingApproval.createdAt).add(2, 'day'), 'day')) {
                yield BookingApprovals.findOne({
                    authcode: authcode,
                });
                const service = yield Service.findOne({
                    _id: bookingApproval.service,
                });
                const bookerEmailDomain = bookingApproval.bookerEmail.split('@')[1];
                for (let i = 0; i < service.whiteList.domains.length; i++) {
                    if (service.whiteList.domains[i] === bookerEmailDomain) {
                        return {
                            approved: true,
                            response: {
                                message: 'Domain of booker is found in whitelist',
                                status: 400,
                            },
                        };
                    }
                }
                for (let i = 0; i < service.whiteList.emails.length; i++) {
                    if (service.whiteList.emails[i] === bookingApproval.bookerEmail) {
                        return {
                            approved: true,
                            response: {
                                message: 'Email of booker is found in whitelist',
                                status: 400,
                            },
                        };
                    }
                }
                service.whiteList.emails.push(bookingApproval.bookerEmail);
                const serviceUpdatedObject = Object.assign({}, service._doc);
                yield Service.findOneAndUpdate({
                    _id: bookingApproval.service,
                }, {
                    $set: Object.assign({}, serviceUpdatedObject),
                });
                const bookingApprovalUpdatedObject = Object.assign(Object.assign({}, bookingApproval._doc), { approved: true });
                yield BookingApprovals.deleteOne({
                    authcode: authcode,
                });
                const { providerName, bookerName, providerEmail, bookerEmail } = bookingApprovalUpdatedObject;
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'RequestBookingAllow',
                    functionParams: functionParams,
                    additionalMessage: 'Email of booker is added in whitelist',
                    startLogId,
                });
                return {
                    approved: true,
                    providerName: providerName,
                    bookerName: bookerName,
                    providerEmail: providerEmail,
                    bookerEmail: bookerEmail,
                    response: {
                        message: 'Email of booker is added in whitelist',
                        status: 200,
                    },
                };
            }
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'RequestBookingAllow',
                functionParams: functionParams,
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=requestBookingAllow.js.map