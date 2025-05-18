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
import _ from 'lodash';
dayjs.extend(utc);
dayjs.extend(timezone);
export default function getRRAvailability(parent, { serviceID, daySelected, bookerTimezone }, context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId = '';
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getRRAvailability',
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
            const serviceData = yield Service.findById(serviceID).populate({
                path: 'roundRobinTeam',
                populate: {
                    path: 'teamMembers.memberId',
                    model: 'User',
                },
            });
            if (!serviceData || (serviceData === null || serviceData === void 0 ? void 0 : serviceData.serviceType) !== SERVICE_TYPES.ROUND_ROBIN) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getRRAvailability',
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
                    response: {
                        message: 'Service Not Found',
                        status: 404,
                    },
                };
            }
            const serviceDataArr = [];
            const bookerDaySelected = dayjs(daySelected).get('day');
            (_a = serviceData === null || serviceData === void 0 ? void 0 : serviceData.roundRobinTeam) === null || _a === void 0 ? void 0 : _a.teamMembers.map((team) => __awaiter(this, void 0, void 0, function* () {
                serviceDataArr.push(Object.assign(Object.assign({}, serviceData._doc), { userId: team.memberId }));
            }));
            const teamAvailabilities = [];
            yield Promise.all(serviceDataArr.map((serviceDataOfArr) => __awaiter(this, void 0, void 0, function* () {
                var _b;
                let availability = yield getAvailabilityBlock(serviceDataOfArr, daySelected, bookerTimezone, bookerDaySelected);
                const bookerUtcOffsetMinutes = dayjs().tz(bookerTimezone).utcOffset();
                const providerUtcOffsetMinutes = dayjs()
                    .tz(serviceDataOfArr.userId.locationDetails.timezone)
                    .utcOffset();
                if (bookerUtcOffsetMinutes < providerUtcOffsetMinutes) {
                    const nextDaySelected = dayjs(daySelected).add(1, 'day');
                    const nextDayAvailability = yield getAvailabilityBlock(serviceDataOfArr, nextDaySelected, bookerTimezone, bookerDaySelected);
                    availability = availability.concat(nextDayAvailability);
                }
                if (bookerUtcOffsetMinutes > providerUtcOffsetMinutes) {
                    const prevDaySelected = dayjs(daySelected).subtract(1, 'day');
                    const prevDayAvailability = yield getAvailabilityBlock(serviceDataOfArr, prevDaySelected, bookerTimezone, bookerDaySelected);
                    availability.unshift(...prevDayAvailability);
                }
                const memberData = (_b = serviceDataOfArr === null || serviceDataOfArr === void 0 ? void 0 : serviceDataOfArr.roundRobinTeam) === null || _b === void 0 ? void 0 : _b.teamMembers.find(member => member.memberId._id === serviceDataOfArr.userId._id);
                const memberResData = memberData.memberId._doc;
                delete memberResData._id;
                delete memberResData.workingHours;
                teamAvailabilities.push({
                    availability: availability,
                    user: memberResData,
                    priority: memberData.priority,
                });
            })));
            const collectiveAv = teamAvailabilities.map(memberAvailabilityData => memberAvailabilityData.availability);
            let uniqueSlots = _.union(...collectiveAv);
            uniqueSlots = uniqueSlots.sort((date1, date2) => dayjs(date1.toString()).isAfter(dayjs(date2.toString())) ? 1 : -1);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getRRAvailability',
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
                teamsAvailability: teamAvailabilities,
                collectiveAvailability: uniqueSlots,
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
                functionName: 'getRRAvailability',
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
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getRRAvailability.js.map