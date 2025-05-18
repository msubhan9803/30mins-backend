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
import getAvailabilityBlock from '../../../../utils/getAvailabilityBlock';
import { SERVICE_TYPES } from '../../../../constants/enums';
dayjs.extend(utc);
dayjs.extend(timezone);
export default function getAvailability(parent, { serviceID, daySelected, bookerTimezone }, _) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId = '';
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getAvailability',
                functionParams: [
                    {
                        paramName: 'serviceID',
                        paramValue: serviceID,
                        paramType: typeof serviceID,
                    },
                    {
                        paramName: 'daySelected',
                        paramValue: daySelected,
                        paramType: typeof daySelected,
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
                'serviceType',
            ]);
            if (!serviceData ||
                ![SERVICE_TYPES.ROUND_ROBIN, SERVICE_TYPES.MEETING].includes(serviceData === null || serviceData === void 0 ? void 0 : serviceData.serviceType)) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getAvailability',
                    functionParams: [
                        {
                            paramName: 'serviceID',
                            paramValue: serviceID,
                            paramType: typeof serviceID,
                        },
                        {
                            paramName: 'daySelected',
                            paramValue: daySelected,
                            paramType: typeof daySelected,
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
                    availableSlots: [],
                    response: {
                        message: 'Service Not Found',
                        status: 404,
                    },
                };
            }
            const bookerDaySelected = dayjs(daySelected).get('day');
            let availability = yield getAvailabilityBlock(serviceData, daySelected, bookerTimezone, bookerDaySelected);
            const bookerUtcOffsetMinutes = dayjs().tz(bookerTimezone).utcOffset();
            const providerUtcOffsetMinutes = dayjs()
                .tz(serviceData.userId.locationDetails.timezone)
                .utcOffset();
            if (bookerUtcOffsetMinutes < providerUtcOffsetMinutes) {
                const nextDaySelected = dayjs(daySelected).add(1, 'day');
                const nextDayAvailability = yield getAvailabilityBlock(serviceData, nextDaySelected, bookerTimezone, bookerDaySelected);
                availability = availability.concat(nextDayAvailability);
            }
            if (bookerUtcOffsetMinutes > providerUtcOffsetMinutes) {
                const prevDaySelected = dayjs(daySelected).subtract(1, 'day');
                const prevDayAvailability = yield getAvailabilityBlock(serviceData, prevDaySelected, bookerTimezone, bookerDaySelected);
                availability.unshift(...prevDayAvailability);
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getAvailability',
                functionParams: [
                    {
                        paramName: 'serviceID',
                        paramValue: serviceID,
                        paramType: typeof serviceID,
                    },
                    {
                        paramName: 'daySelected',
                        paramValue: daySelected,
                        paramType: typeof daySelected,
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
                availableSlots: availability,
                response: {
                    message: 'Availability Slots Returned',
                    status: 200,
                },
            };
        }
        catch (err) {
            console.log(err);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getAvailability',
                functionParams: [
                    {
                        paramName: 'serviceID',
                        paramValue: serviceID,
                        paramType: typeof serviceID,
                    },
                    {
                        paramName: 'daySelected',
                        paramValue: daySelected,
                        paramType: typeof daySelected,
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
                availableSlots: [],
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getAvailability.js.map