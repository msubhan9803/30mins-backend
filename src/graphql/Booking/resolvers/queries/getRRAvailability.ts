import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import Service from '../../../../MongoModels/Service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import getAvailabilityBlock from '../../../../utils/getAvailabilityBlock';
import {SERVICE_TYPES} from '../../../../constants/enums';
import _ from 'lodash';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function getRRAvailability(
  parent,
  {serviceID, daySelected, bookerTimezone},
  context
) {
  let startLogId: String = '';

  try {
    startLogId = await createApiLog({
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

    const serviceData = await Service.findById(serviceID).populate({
      path: 'roundRobinTeam',
      populate: {
        path: 'teamMembers.memberId',
        model: 'User',
      },
    });

    if (!serviceData || serviceData?.serviceType !== SERVICE_TYPES.ROUND_ROBIN) {
      await createApiLog({
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
    serviceData?.roundRobinTeam?.teamMembers.map(async team => {
      serviceDataArr.push({...serviceData._doc, userId: team.memberId});
    });

    const teamAvailabilities = [];
    await Promise.all(
      serviceDataArr.map(async serviceDataOfArr => {
        let availability = await getAvailabilityBlock(
          serviceDataOfArr,
          daySelected,
          bookerTimezone,
          bookerDaySelected
        );
        const bookerUtcOffsetMinutes = dayjs().tz(bookerTimezone).utcOffset();
        const providerUtcOffsetMinutes = dayjs()
          .tz(serviceDataOfArr.userId.locationDetails.timezone)
          .utcOffset();

        if (bookerUtcOffsetMinutes < providerUtcOffsetMinutes) {
          const nextDaySelected = dayjs(daySelected).add(1, 'day');
          const nextDayAvailability = await getAvailabilityBlock(
            serviceDataOfArr,
            nextDaySelected,
            bookerTimezone,
            bookerDaySelected
          );
          availability = availability.concat(nextDayAvailability);
        }

        if (bookerUtcOffsetMinutes > providerUtcOffsetMinutes) {
          const prevDaySelected = dayjs(daySelected).subtract(1, 'day');
          const prevDayAvailability = await getAvailabilityBlock(
            serviceDataOfArr,
            prevDaySelected,
            bookerTimezone,
            bookerDaySelected
          );
          availability.unshift(...prevDayAvailability);
        }
        const memberData = serviceDataOfArr?.roundRobinTeam?.teamMembers.find(
          member => member.memberId._id === serviceDataOfArr.userId._id
        );
        const memberResData = memberData.memberId._doc;
        delete memberResData._id;
        delete memberResData.workingHours;

        teamAvailabilities.push({
          availability: availability,
          user: memberResData,
          priority: memberData.priority,
        });
      })
    );
    const collectiveAv = teamAvailabilities.map(
      memberAvailabilityData => memberAvailabilityData.availability
    );
    let uniqueSlots = _.union(...collectiveAv);

    uniqueSlots = uniqueSlots.sort((date1, date2) =>
      dayjs(date1.toString()).isAfter(dayjs(date2.toString())) ? 1 : -1
    );

    await createApiLog({
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
  } catch (err) {
    await createApiLog({
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
}
