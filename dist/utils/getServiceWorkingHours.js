export default function getServiceWorkingHours(serviceData, weekDay) {
    if (!serviceData.serviceWorkingHours[weekDay].isActive ||
        serviceData.serviceWorkingHours[weekDay].availability.length === 0) {
        return [];
    }
    return serviceData.serviceWorkingHours[weekDay].availability.map(workingHourBlock => ({
        start: workingHourBlock.start,
        end: workingHourBlock.end,
    }));
}
//# sourceMappingURL=getServiceWorkingHours.js.map