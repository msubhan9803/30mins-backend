import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import User from '../../../../MongoModels/User';
import getBusyTimes from '../../../../utils/busyTimes/getBusyTimes';

dayjs.extend(utc);
dayjs.extend(timezone);

export default async function checkRecurringAvailability(
  parent,
  {providerUsername, initialBookingDateTime, meetingCount}
) {
  let startLogId: String = '';

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'checkRecurringAvailability',
      functionParams: [
        {
          paramName: 'providerUsername',
          paramValue: providerUsername,
          paramType: typeof providerUsername,
        },
        {
          paramName: 'initialBookingDateTime',
          paramValue: initialBookingDateTime,
          paramType: typeof initialBookingDateTime,
        },
        {
          paramName: 'meetingCount',
          paramValue: meetingCount,
          paramType: typeof meetingCount,
        },
      ],
    });
    const providerData = await User.findOne({'accountDetails.username': providerUsername}, ['_id']);

    if (!providerData) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'checkRecurringAvailability',
        functionParams: [
          {
            paramName: 'providerUsername',
            paramValue: providerUsername,
            paramType: typeof providerUsername,
          },
          {
            paramName: 'initialBookingDateTime',
            paramValue: initialBookingDateTime,
            paramType: typeof initialBookingDateTime,
          },
          {
            paramName: 'meetingCount',
            paramValue: meetingCount,
            paramType: typeof meetingCount,
          },
        ],
        additionalMessage: 'Service Not Found',
        startLogId,
      });
    }
    const meetingArr = [];

    for (let index = 0; index <= meetingCount; index++) {
      meetingArr.push(
        dayjs(initialBookingDateTime)
          .add(index * 7, 'day')
          .toISOString()
      );
    }

    const providerUser = [{_id: providerData._id}];
    const busyTimes = await getBusyTimes(providerUser, meetingArr[0], meetingArr[meetingCount]);

    try {
      meetingArr.forEach(meetingTime => {
        let isBusy = false;
        busyTimes.forEach(slot => {
          if (
            dayjs(slot.start).isSameOrBefore(dayjs(meetingTime.replace('.000Z', 'Z'))) &&
            dayjs(slot.start).isSameOrAfter(dayjs(meetingTime.replace('.000Z', 'Z')))
          ) {
            isBusy = true;
          }
        });
        if (isBusy) {
          throw new Error('Provider is not Available for Recurring');
        }
      });
      return {
        isAvailable: true,
        availabilities: meetingArr,
        response: {
          message: 'Provider is available!',
          status: 200,
        },
      };
    } catch (err) {
      return {
        isAvailable: false,
        availabilities: [],
        response: {
          message: err.message,
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'checkRecurringAvailability',
      functionParams: [
        {
          paramName: 'providerUsername',
          paramValue: providerUsername,
          paramType: typeof providerUsername,
        },
        {
          paramName: 'initialBookingDateTime',
          paramValue: initialBookingDateTime,
          paramType: typeof initialBookingDateTime,
        },
        {
          paramName: 'meetingCount',
          paramValue: meetingCount,
          paramType: typeof meetingCount,
        },
      ],
      additionalMessage: 'Availability Slots Returned',
      startLogId,
    });

    return {
      isAvailable: true,
      availabilities: [],
      response: {
        message: 'Provider is available!',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'checkRecurringAvailability',
      functionParams: [
        {
          paramName: 'providerUsername',
          paramValue: providerUsername,
          paramType: typeof providerUsername,
        },
        {
          paramName: 'initialBookingDateTime',
          paramValue: initialBookingDateTime,
          paramType: typeof initialBookingDateTime,
        },
        {
          paramName: 'meetingCount',
          paramValue: meetingCount,
          paramType: typeof meetingCount,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
