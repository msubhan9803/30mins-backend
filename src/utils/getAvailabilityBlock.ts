import dayjs from 'dayjs';
import _ from 'lodash';
import {DAY_OF_WEEK} from '../constants/variables';
import getServiceWorkingHours from './getServiceWorkingHours';
import getProviderWorkingHours from './getProviderWorkingHours';
import getBusyTimes from './busyTimes/getBusyTimes';
import BookedMeeting from '../MongoModels/BookedMeeting';

function isBookingFutureCheck(booking) {
  return dayjs().utc().isBefore(booking.meetingDate);
}

export default async function getAvailabilityBlock(
  serviceData,
  daySelected,
  bookerTimezone,
  bookerDaySelected
) {
  const providerTimezone = serviceData.userId.locationDetails.timezone;
  const serviceDurationMinutes = serviceData.duration;
  const providerWorkingHours = serviceData.userId.workingHours;
  const startOfDaySelected = dayjs(daySelected).tz(providerTimezone, true).startOf('day');
  const endOfDaySelected = dayjs(daySelected).tz(providerTimezone, true).endOf('day');
  let providerWorkingHoursBlocks;
  const weekDay = DAY_OF_WEEK[startOfDaySelected.day()];

  if (serviceData?.serviceWorkingHours?.isCustomEnabled) {
    providerWorkingHoursBlocks = getServiceWorkingHours(serviceData, weekDay);
  } else {
    providerWorkingHoursBlocks = getProviderWorkingHours(providerWorkingHours, weekDay);
  }

  if (providerWorkingHoursBlocks.length === 0) {
    return [];
  }

  let busyTimes = await getBusyTimes(
    [serviceData.userId],
    startOfDaySelected.toISOString(),
    endOfDaySelected.toISOString()
  );

  const evntCalTemp = await BookedMeeting.find({
    serviceID: serviceData._id,
    $and: [
      {startTime: {$gte: startOfDaySelected.toISOString()}},
      {endTime: {$lte: endOfDaySelected.toISOString()}},
    ],
  });

  let evntCal = [];
  for (let index = 0; index < evntCalTemp.length; index++) {
    const event = evntCalTemp[index];
    const isFutureBookingVal = isBookingFutureCheck(event);
    if (isFutureBookingVal) {
      evntCal.push(event);
    }
  }

  evntCal = evntCal.map(el => ({end: el.endTime, start: el.startTime}));
  busyTimes = await _.union(busyTimes, evntCal);

  const firstSlotStartMinutes = providerWorkingHoursBlocks[0].start;
  const lastSlotEndMinutes = providerWorkingHoursBlocks.slice(-1)[0].end;

  const allAvailableStartTimes = [];

  for (
    let minutes = firstSlotStartMinutes;
    minutes < lastSlotEndMinutes;
    minutes += serviceDurationMinutes
  ) {
    const currentSlotStartProviderTime = dayjs(daySelected)
      .tz(providerTimezone, true)
      .startOf('day')
      .add(minutes, 'minute');

    const currentSlotStartBookerTime = currentSlotStartProviderTime.tz(bookerTimezone);

    const isSlotAvailable = providerWorkingHoursBlocks.some(workingHourBlock => {
      const blockStart = dayjs(daySelected)
        .tz(providerTimezone, true)
        .startOf('day')
        .add(workingHourBlock.start, 'minute');

      const blockEnd = dayjs(daySelected)
        .tz(providerTimezone, true)
        .startOf('day')
        .add(workingHourBlock.end, 'minute');

      return dayjs(currentSlotStartProviderTime).isBetween(blockStart, blockEnd, 'minutes', '[)');
    });

    if (isSlotAvailable) {
      const isSlotBusy = busyTimes.some(busyTime =>
        dayjs(currentSlotStartProviderTime).isBetween(busyTime.start, busyTime.end, 'minutes', '[)')
      );

      const isFutureDate = currentSlotStartProviderTime.isAfter(dayjs());
      const isSameDay = currentSlotStartBookerTime.get('day') === bookerDaySelected;

      if (!isSlotBusy && isFutureDate && isSameDay) {
        allAvailableStartTimes.push(currentSlotStartProviderTime.toISOString());
      }
    }
  }

  return allAvailableStartTimes;
}
