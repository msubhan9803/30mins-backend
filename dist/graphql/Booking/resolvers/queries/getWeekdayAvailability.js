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
import Service from '../../../../MongoModels/Service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import getWorkingWeekdays from '../../../../utils/getWorkingWeekdays';
dayjs.extend(utc);
dayjs.extend(timezone);
export default function getWeekdayAvailability(parent, { serviceID, bookerTimezone }, _) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId = '';
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getWeekdayAvailability',
                functionParams: [
                    {
                        paramName: 'serviceID',
                        paramValue: serviceID,
                        paramType: typeof serviceID,
                    },
                    {
                        paramName: 'bookerTimezone',
                        paramValue: bookerTimezone,
                        paramType: typeof bookerTimezone,
                    },
                ],
            });
            const serviceData = yield Service.findById(serviceID).populate('userId', [
                '_id',
                'workingHours',
                'locationDetails.timezone',
            ]);
            const weekdayAvailability = getWorkingWeekdays(serviceData, bookerTimezone);
            if (!serviceData) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getWeekdayAvailability',
                    functionParams: [
                        {
                            paramName: 'serviceID',
                            paramValue: serviceID,
                            paramType: typeof serviceID,
                        },
                        {
                            paramName: 'bookerTimezone',
                            paramValue: bookerTimezone,
                            paramType: typeof bookerTimezone,
                        },
                    ],
                    additionalMessage: 'Service Not Found',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Service Not Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getWeekdayAvailability',
                functionParams: [
                    {
                        paramName: 'serviceID',
                        paramValue: serviceID,
                        paramType: typeof serviceID,
                    },
                    {
                        paramName: 'bookerTimezone',
                        paramValue: bookerTimezone,
                        paramType: typeof bookerTimezone,
                    },
                ],
                additionalMessage: 'Availability Slots Returned',
                startLogId,
            });
            return {
                availableWeekdays: weekdayAvailability,
                response: {
                    message: 'Availability Slots Returned',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getWeekdayAvailability',
                functionParams: [
                    {
                        paramName: 'serviceID',
                        paramValue: serviceID,
                        paramType: typeof serviceID,
                    },
                    {
                        paramName: 'bookerTimezone',
                        paramValue: bookerTimezone,
                        paramType: typeof bookerTimezone,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getWeekdayAvailability.js.map