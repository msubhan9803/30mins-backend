import dayjs from 'dayjs';
import getServiceWorkingHours from './getServiceWorkingHours';
import getProviderWorkingHours from './getProviderWorkingHours';
import { DAY_OF_WEEK } from '../constants/variables';
export default function getWorkingWeekdays(serviceData, bookerTimezone) {
    const providerWorkingHours = serviceData.userId.workingHours;
    const providerTimezone = serviceData.userId.locationDetails.timezone;
    const providerUtcOffset = dayjs().tz(providerTimezone).utcOffset();
    const bookerUtcOffset = dayjs().tz(bookerTimezone).utcOffset();
    const utcDifferentialInMinutes = providerUtcOffset - bookerUtcOffset;
    const workingDays = Object.keys(DAY_OF_WEEK).map(weekDayNum => {
        var _a;
        let providerWorkingHoursBlocks = [];
        const weekdayInText = DAY_OF_WEEK[weekDayNum];
        if ((_a = serviceData === null || serviceData === void 0 ? void 0 : serviceData.serviceWorkingHours) === null || _a === void 0 ? void 0 : _a.isCustomEnabled) {
            providerWorkingHoursBlocks = getServiceWorkingHours(serviceData, weekdayInText);
        }
        else {
            providerWorkingHoursBlocks = getProviderWorkingHours(providerWorkingHours, weekdayInText);
        }
        if (providerWorkingHoursBlocks.length === 0) {
            return;
        }
        const convertedFirstSlotStartMinutes = providerWorkingHoursBlocks[0].start - utcDifferentialInMinutes;
        const convertedLastSlotEndMinutes = providerWorkingHoursBlocks.slice(-1)[0].end - utcDifferentialInMinutes;
        const allDaysMatched = [];
        if (convertedFirstSlotStartMinutes < 0 && parseInt(weekDayNum, 10) !== 0) {
            allDaysMatched.push(parseInt(weekDayNum, 10) - 1);
        }
        if (convertedLastSlotEndMinutes > 1440 && parseInt(weekDayNum, 10) !== 6) {
            allDaysMatched.push(parseInt(weekDayNum, 10) + 1);
        }
        if ((convertedFirstSlotStartMinutes >= 0 && convertedFirstSlotStartMinutes <= 1440) ||
            convertedLastSlotEndMinutes <= 1440) {
            allDaysMatched.push(parseInt(weekDayNum, 10));
        }
        // eslint-disable-next-line consistent-return
        return allDaysMatched;
    });
    // Remove undefined values
    return workingDays.flatMap(day => (day ? day : []));
}
//# sourceMappingURL=getWorkingWeekdays.js.map