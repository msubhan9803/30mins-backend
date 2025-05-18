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
import { v4 as uuid } from 'uuid';
import BookingApprovals from '../../../../MongoModels/BookingApprovals';
export default function requestBookingApprovals(_, { serviceId, bookerEmail, providerEmail, providerName, bookerName }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId = '';
        const { token } = context;
        const functionParams = [
            {
                paramName: 'serviceId',
                paramValue: serviceId,
                paramType: typeof serviceId,
            },
            {
                paramName: 'bookerEmail',
                paramValue: bookerEmail,
                paramType: typeof bookerEmail,
            },
            {
                paramName: 'providerEmail',
                paramValue: providerEmail,
                paramType: typeof providerEmail,
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
                functionName: 'RequestBookingApprovals',
                functionParams: functionParams,
                additionalMessage: 'Starting Mutation',
            });
            const SECRETS = yield AwsSecrets.getInstance();
            if (token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'RequestBookingApprovals',
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
            yield BookingApprovals.findOneAndDelete({
                service: serviceId,
                providerEmail: providerEmail,
                bookerEmail: bookerEmail,
            });
            const bookingApproval = yield BookingApprovals.create({
                service: serviceId,
                providerEmail: providerEmail,
                bookerEmail: bookerEmail,
                providerName: providerName,
                bookerName: bookerName,
                authcode: uuid(),
                approved: false,
                denied: false,
                approvalRequested: true,
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'RequestBookingApprovals',
                functionParams: functionParams,
                additionalMessage: 'Approval requested.',
                startLogId,
            });
            return {
                authcode: bookingApproval.authcode,
                response: {
                    message: 'Approval requested.',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'RequestBookingApprovals',
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
//# sourceMappingURL=requestBookingApproval.js.map