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
import bookingOTP from '../../../../MongoModels/BookingOTP';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
export default function generateBookingOTP(parent, { email, serviceId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token } = context;
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'generateBookingOTP',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
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
            email = email.trim().toLowerCase();
            const otpExist = yield bookingOTP.exists({
                email,
                serviceId,
            });
            if (otpExist) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'generateBookingOTP',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
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
                    additionalMessage: 'Otp for this email and service already exist.',
                    startLogId,
                });
                return {
                    message: 'Otp for this email and service already exist.',
                    status: 409,
                };
            }
            const otpToken = Math.floor(100000 + Math.random() * 900000);
            yield bookingOTP.create({
                otpToken,
                email,
                serviceId,
            });
            yield sendEmail({
                otpToken,
            }, email, TEMPLATES.SIGN_IN.OTP_VERIFICATION, 'signups@30mins.com');
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'generateBookingOTP',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
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
                additionalMessage: 'OTP generated Succesfully.',
                startLogId,
            });
            return {
                message: 'OTP generated Succesfully.',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'generateBookingOTP',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
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
                    functionName: 'generateBookingOTP',
                    functionParams: [
                        {
                            paramName: 'email',
                            paramValue: email,
                            paramType: typeof email,
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
                functionName: 'generateBookingOTP',
                functionParams: [
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
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
//# sourceMappingURL=generateBookingOTP.js.map