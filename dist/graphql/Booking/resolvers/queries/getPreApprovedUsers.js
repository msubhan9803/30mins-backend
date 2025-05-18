var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dayjs from 'dayjs';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Service from '../../../../MongoModels/Service';
import BookingApprovals from '../../../../MongoModels/BookingApprovals';
export default function getPreApprovedUsers(_, args, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId = '';
        const { token } = context;
        const { serviceID, bookerEmail, providerEmail } = args;
        const functionParams = [
            {
                paramName: 'args',
                paramValue: args,
                paramType: typeof args,
            },
            {
                paramName: 'token',
                paramValue: 'HIDDEN_TOKEN',
                paramType: typeof token,
            },
        ];
        startLogId = yield createApiLog({
            type: ApiLogTypes.MUTATION_START,
            level: ApiLogLevels.INFO,
            functionName: 'getPreApprovedUsers',
            functionParams: [
                {
                    paramName: 'args',
                    paramValue: args,
                    paramType: typeof args,
                },
                {
                    paramName: 'token',
                    paramValue: 'HIDDEN_TOKEN',
                    paramType: typeof token,
                },
            ],
        });
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getPreApprovedUsers',
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
            const service = yield Service.findOne({
                _id: serviceID,
            }).exec();
            const bookerEmailDomain = bookerEmail.split('@')[1];
            for (let i = 0; i < service.whiteList.domains.length; i++) {
                if (service.whiteList.domains[i] === bookerEmailDomain) {
                    return {
                        approved: true,
                        dayPassed: false,
                        approvalRequested: false,
                        response: {
                            message: 'Domain of booker is found in whitelist',
                            status: 200,
                        },
                    };
                }
            }
            for (let i = 0; i < service.whiteList.emails.length; i++) {
                if (service.whiteList.emails[i] === bookerEmail) {
                    return {
                        approved: true,
                        dayPassed: false,
                        approvalRequested: false,
                        response: {
                            message: 'Email of booker is found in whitelist',
                            status: 200,
                        },
                    };
                }
            }
            const bookingApproval = yield BookingApprovals.findOne({
                service: serviceID,
                providerEmail: providerEmail,
                bookerEmail: bookerEmail,
            });
            if (!bookingApproval) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getPreApprovedUsers',
                    functionParams: functionParams,
                    additionalMessage: 'Approval Request Not Found',
                    startLogId,
                });
                return {
                    approved: false,
                    dayPassed: false,
                    approvalRequested: false,
                    response: {
                        message: 'Approval Request Not Found',
                        status: 404,
                    },
                };
            }
            if (bookingApproval === null || bookingApproval === void 0 ? void 0 : bookingApproval.approved) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getPreApprovedUsers',
                    functionParams: functionParams,
                    additionalMessage: 'User Has Been Approved',
                    startLogId,
                });
                return {
                    approved: true,
                    dayPassed: false,
                    approvalRequested: true,
                    response: {
                        message: 'User Has Been Approved',
                        status: 404,
                    },
                };
            }
            if (!(bookingApproval === null || bookingApproval === void 0 ? void 0 : bookingApproval.approved)) {
                if (dayjs().isAfter(bookingApproval.createdAt, 'day')) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.INFO,
                        functionName: 'getPreApprovedUsers',
                        functionParams: functionParams,
                        additionalMessage: 'User Has Not Been Approved. One Day Has Been Passed.',
                        startLogId,
                    });
                    return {
                        approved: false,
                        dayPassed: true,
                        approvalRequested: true,
                        response: {
                            message: 'User Has Not Been Approved. One Day Has Been Passed.',
                            status: 404,
                        },
                    };
                }
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getPreApprovedUsers',
                    functionParams: functionParams,
                    additionalMessage: 'User Has Not Been Approved. One Day Has Not Been Passed.',
                    startLogId,
                });
                return {
                    approved: false,
                    dayPassed: false,
                    approvalRequested: true,
                    response: {
                        message: 'User Has Not Been Approved. One Day Has Not Been Passed.',
                        status: 404,
                    },
                };
            }
            return {
                approved: false,
                dayPassed: false,
                approvalRequested: false,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getPreApprovedUsers',
                functionParams: [
                    {
                        paramName: 'args',
                        paramValue: args,
                        paramType: typeof args,
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
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=getPreApprovedUsers.js.map