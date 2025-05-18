var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Service from '../../../../MongoModels/Service';
export default function getCurrentSlotBookings(parent, { serviceID, startTime, endTime, attendeeLimit }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token } = context;
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(token, accessTokenSecret);
        let functionParams = [
            {
                paramName: 'serviceID',
                paramValue: serviceID,
                paramType: typeof serviceID,
            },
            {
                paramName: 'startTime',
                paramValue: startTime,
                paramType: typeof startTime,
            },
            {
                paramName: 'endTime',
                paramValue: endTime,
                paramType: typeof endTime,
            },
            {
                paramName: 'attendeeLimit',
                paramValue: attendeeLimit,
                paramType: typeof attendeeLimit,
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
        ];
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getCurrentSlotBookings',
                functionParams: functionParams,
            });
            const service = yield Service.findById(serviceID, ['attendeeLimit']);
            const bookingCount = yield BookedMeeting.count({ serviceId: serviceID, startTime, endTime });
            if (bookingCount => service.attendeeLimit) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getCurrentSlotBookings',
                    functionParams: functionParams,
                    additionalMessage: 'Slots Booked!, Booker all slots are booked!',
                    startLogId,
                });
                return {
                    numOfBookedSlot: bookingCount,
                    response: {
                        message: 'Slots Booked!, Booker all slots are booked!',
                        status: 401,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getCurrentSlotBookings',
                functionParams: functionParams,
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                numOfBookedSlot: bookingCount,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                functionParams.pop();
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getCurrentSlotBookings',
                    functionParams: functionParams,
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getCurrentSlotBookings',
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
//# sourceMappingURL=getCurrentSlotBookings.js.map