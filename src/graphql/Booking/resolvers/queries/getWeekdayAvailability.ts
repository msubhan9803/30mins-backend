import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import Service from '../../../../MongoModels/Service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import getWorkingWeekdays from '../../../../utils/getWorkingWeekdays';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function getWeekdayAvailability(parent, {serviceID, bookerTimezone}, _) {
  let startLogId: String = '';

  try {
    startLogId = await createApiLog({
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

    const serviceData = await Service.findById(serviceID).populate('userId', [
      '_id',
      'workingHours',
      'locationDetails.timezone',
    ]);

    const weekdayAvailability = getWorkingWeekdays(serviceData, bookerTimezone);

    if (!serviceData) {
      await createApiLog({
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

    await createApiLog({
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
  } catch (err) {
    await createApiLog({
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
}
