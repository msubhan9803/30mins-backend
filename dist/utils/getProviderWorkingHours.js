export default function getProviderWorkingHours(providerWorkingHours, weekDay) {
    if (providerWorkingHours.isCustomEnabled) {
        if (!providerWorkingHours[weekDay].isActive ||
            providerWorkingHours[weekDay].availability.length === 0) {
            return [];
        }
        return providerWorkingHours[weekDay].availability.map(workingHourBlock => ({
            start: workingHourBlock.start,
            end: workingHourBlock.end,
        }));
    }
    return [{ start: providerWorkingHours.startTime, end: providerWorkingHours.endTime }];
}
//# sourceMappingURL=getProviderWorkingHours.js.map