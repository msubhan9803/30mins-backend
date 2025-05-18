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
import bookingOTP from '../../../../MongoModels/BookingOTP';
export default function confirmBookingOTP(parent, { email, serviceId, otpToken }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token } = context;
        let startLogId;
        const ENV_VALUES = yield AwsSecrets.getInstance();
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'confirmBookingOTP',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                    {
                        paramName: 'otpToken',
                        paramValue: otpToken,
                        paramType: typeof otpToken,
                    },
                    {
                        paramName: 'serviceId',
                        paramValue: serviceId,
                        paramType: typeof serviceId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
            });
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'confirmBookingOTP',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                        {
                            paramName: 'otpToken',
                            paramValue: otpToken,
                            paramType: typeof otpToken,
                        },
                        {
                            paramName: 'serviceId',
                            paramValue: serviceId,
                            paramType: typeof serviceId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            email = email.trim().toLowerCase();
            otpToken = otpToken.trim().toLowerCase();
            const otpExist = yield bookingOTP.exists({
                email,
                serviceId,
                otpToken,
                verified: true,
            });
            if (!otpExist) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'confirmBookingOTP',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                        {
                            paramName: 'otpToken',
                            paramValue: otpToken,
                            paramType: typeof otpToken,
                        },
                        {
                            paramName: 'serviceId',
                            paramValue: serviceId,
                            paramType: typeof serviceId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Otp not found.',
                    startLogId,
                });
                return {
                    message: 'Otp not found.',
                    status: 404,
                };
            }
            yield bookingOTP.deleteOne({
                email,
                serviceId,
                otpToken,
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'confirmBookingOTP',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                    {
                        paramName: 'otpToken',
                        paramValue: otpToken,
                        paramType: typeof otpToken,
                    },
                    {
                        paramName: 'serviceId',
                        paramValue: serviceId,
                        paramType: typeof serviceId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
                additionalMessage: 'OTP Confirmed succesfully.',
                startLogId,
            });
            return {
                message: 'OTP Confirmed succesfully.',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'confirmBookingOTP',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                        {
                            paramName: 'otpToken',
                            paramValue: otpToken,
                            paramType: typeof otpToken,
                        },
                        {
                            paramName: 'serviceId',
                            paramValue: serviceId,
                            paramType: typeof serviceId,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'BookingOTP validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'confirmBookingOTP',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
                        },
                        {
                            paramName: 'otpToken',
                            paramValue: otpToken,
                            paramType: typeof otpToken,
                        },
                        {
                            paramName: 'serviceId',
                            paramValue: serviceId,
                            paramType: typeof serviceId,
                        },
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
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
                functionName: 'confirmBookingOTP',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                    {
                        paramName: 'otpToken',
                        paramValue: otpToken,
                        paramType: typeof otpToken,
                    },
                    {
                        paramName: 'serviceId',
                        paramValue: serviceId,
                        paramType: typeof serviceId,
                    },
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
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
//# sourceMappingURL=confirmBookingOTP.js.map