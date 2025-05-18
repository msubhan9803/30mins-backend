import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import minMax from 'dayjs/plugin/minMax';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import getBusyTimes from '../../../../utils/busyTimes/getBusyTimes';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import _ from 'lodash';
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
export default async function getCollectiveAvailability(
  parent,
  {emails, date, duration, checkExtension},
  context,
  info
) {
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getCollectiveAvailability',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'emails',
          paramValue: emails,
          paramType: typeof emails,
        },
        {
          paramName: 'date',
          paramValue: date,
          paramType: typeof date,
        },
        {
          paramName: 'duration',
          paramValue: duration,
          paramType: typeof duration,
        },
        {
          paramName: 'checkExtension',
          paramValue: checkExtension,
          paramType: typeof checkExtension,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });
    if (checkExtension) {
      const hasExtension = await ActiveExtension.exists({
        userId: decodedToken.UserId,
        extensionProductId: stripeProductIDs.EXTENSIONS.COLLECTIVE_AVAILABILITY,
        status: {
          $in: ['paid', 'gifted'],
        },
      });
      if (!hasExtension) {
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getCollectiveAvailability',
          functionParams: [
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
            {
              paramName: 'emails',
              paramValue: emails,
              paramType: typeof emails,
            },
            {
              paramName: 'date',
              paramValue: date,
              paramType: typeof date,
            },
            {
              paramName: 'duration',
              paramValue: duration,
              paramType: typeof duration,
            },
            {
              paramName: 'checkExtension',
              paramValue: checkExtension,
              paramType: typeof checkExtension,
            },
            {
              paramName: 'userId',
              paramValue: decodedToken.UserId,
              paramType: typeof decodedToken.UserId,
            },
          ],
          additionalMessage: 'User does not have COLLECTIVE AVAILABILITY Extension',
          startLogId,
        });
        return {
          availableTimeSlots: [],
          response: {
            message: 'User does not have COLLECTIVE AVAILABILITY Extension',
            status: 400,
          },
        };
      }
    }

    if (duration <= 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCollectiveAvailability',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'emails',
            paramValue: emails,
            paramType: typeof emails,
          },
          {
            paramName: 'date',
            paramValue: date,
            paramType: typeof date,
          },
          {
            paramName: 'duration',
            paramValue: duration,
            paramType: typeof duration,
          },
          {
            paramName: 'checkExtension',
            paramValue: checkExtension,
            paramType: typeof checkExtension,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Invalid Duration',
        startLogId,
      });
      return {
        availableTimeSlots: [],
        response: {
          message: 'Invalid Duration: Duration must be greator than 0.',
          status: 400,
        },
      };
    }
    if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCollectiveAvailability',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'emails',
            paramValue: emails,
            paramType: typeof emails,
          },
          {
            paramName: 'date',
            paramValue: date,
            paramType: typeof date,
          },
          {
            paramName: 'duration',
            paramValue: duration,
            paramType: typeof duration,
          },
          {
            paramName: 'checkExtension',
            paramValue: checkExtension,
            paramType: typeof checkExtension,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Invalid Date Input',
        startLogId,
      });
      return {
        availableTimeSlots: [],
        response: {
          message: 'Invalid Date Input.',
          status: 400,
        },
      };
    }
    let users = emails.map(async email =>
      User.findOne({'accountDetails.email': {$regex: email}}, [
        '_id',
        'accountDetails.email',
        'locationDetails.timezone',
        'workingHours',
      ])
        .orFail(() => new Error('User Document Not Found'))
        .exec()
    );
    users = await Promise.all(users);
    const startTimeArr = [];
    const endTimeArr = [];

    const day = extractDayName(date);
    users.forEach(user => {
      if (
        user?.workingHours.isCustomEnabled &&
        user?.workingHours[day]?.isActive &&
        user?.workingHours[day]?.availability[0]
      ) {
        const firstSlot = user?.workingHours[day]?.availability[0];
        const lastSlot: {start: number; end: number} = _.last(
          user?.workingHours[day]?.availability
        );
        startTimeArr.push(
          dayjs
            .tz(date, user?.locationDetails.timezone)
            .startOf('d')
            .add(firstSlot.start, 'm')
            .utc()
        );

        endTimeArr.push(
          dayjs.tz(date, user?.locationDetails.timezone).startOf('d').add(lastSlot.end, 'm').utc()
        );
      } else {
        startTimeArr.push(
          dayjs
            .tz(date, user?.locationDetails.timezone)
            .startOf('d')
            .add(user?.workingHours.startTime.toString(), 'm')
            .utc()
        );
        endTimeArr.push(
          dayjs
            .tz(date, user?.locationDetails.timezone)
            .startOf('d')
            .add(user?.workingHours.endTime, 'm')
            .utc()
        );
      }
    });
    let minTime = dayjs.max(startTimeArr);
    let maxTime = dayjs.min(endTimeArr);

    if (minTime.isSameOrAfter(maxTime)) {
      return {
        availableTimeSlots: [],
        response: {
          message: 'No Slot Available.',
          status: 200,
        },
      };
    }

    const busyTimes = await getBusyTimes(
      users,
      minTime.utc().toISOString(),
      maxTime.utc().toISOString()
    );

    const availableTimeSlots = [];
    while (!minTime.isSameOrAfter(maxTime)) {
      if (
        !checkIfConflict(busyTimes, minTime, duration) &&
        includesInUsersWorkingHour(users, minTime, day)
      ) {
        availableTimeSlots.push(minTime.format('hh:mma'));
      }
      minTime = minTime.add(duration, 'minute');
    }
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getCollectiveAvailability',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'emails',
          paramValue: emails,
          paramType: typeof emails,
        },
        {
          paramName: 'date',
          paramValue: date,
          paramType: typeof date,
        },
        {
          paramName: 'checkExtension',
          paramValue: checkExtension,
          paramType: typeof checkExtension,
        },
        {
          paramName: 'duration',
          paramValue: duration,
          paramType: typeof duration,
        },
        {
          paramName: 'minTimePost',
          paramValue: minTime.utc().format().split('').splice(0, 19).join(''),
          paramType: typeof minTime.utc().format().split('').splice(0, 19).join(''),
        },
        {
          paramName: 'maxTimePost',
          paramValue: maxTime.utc().format().split('').splice(0, 19).join(''),
          paramType: typeof maxTime.utc().format().split('').splice(0, 19).join(''),
        },
        {
          paramName: 'minTimePre',
          paramValue: minTime.format().split('').splice(0, 19).join(''),
          paramType: typeof minTime.format().split('').splice(0, 19).join(''),
        },
        {
          paramName: 'maxTimePre',
          paramValue: maxTime.format().split('').splice(0, 19).join(''),
          paramType: typeof maxTime.format().split('').splice(0, 19).join(''),
        },
      ],
      additionalMessage: 'getCollectiveAvailability Query Sucessful',
      startLogId,
    });
    return {
      availableTimeSlots,
      response: {
        message: 'All Available Slots',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCollectiveAvailability',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'emails',
            paramValue: emails,
            paramType: typeof emails,
          },
          {
            paramName: 'date',
            paramValue: date,
            paramType: typeof date,
          },
          {
            paramName: 'duration',
            paramValue: duration,
            paramType: typeof duration,
          },
          {
            paramName: 'checkExtension',
            paramValue: checkExtension,
            paramType: typeof checkExtension,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });
      return {
        availableTimeSlots: [],
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getCollectiveAvailability',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'emails',
          paramValue: emails,
          paramType: typeof emails,
        },
        {
          paramName: 'date',
          paramValue: date,
          paramType: typeof date,
        },
        {
          paramName: 'duration',
          paramValue: duration,
          paramType: typeof duration,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'checkExtension',
          paramValue: checkExtension,
          paramType: typeof checkExtension,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });
    return {
      availableTimeSlots: [],
      response: {message: err.message, status: 500},
    };
  }
}
function checkIfConflict(data, minTime, duration) {
  let check = false;
  data.forEach(period => {
    if (minTime.isBetween(dayjs(period.start), dayjs(period.end), null, '[)')) {
      check = true;
    }
  });
  return check;
}
function includesInUsersWorkingHour(users, minTime, day) {
  let userCheck = true;
  let workingHoursCheck = true;
  users.forEach(user => {
    if (user?.workingHours.isCustomEnabled && user?.workingHours[day]?.isActive) {
      workingHoursCheck = user?.workingHours[day]?.availability.some(time => {
        return minTime.isBetween(
          dayjs(day).tz(user?.locationDetails.timezone).startOf('d').add(time.start, 'm').utc(),
          dayjs(day).tz(user?.locationDetails.timezone).startOf('d').add(time.end, 'm').utc(),
          'minute',
          '[]'
        );
      });

      if (!workingHoursCheck) {
        return workingHoursCheck;
      }
    } else {
      if (
        !minTime.isBetween(
          dayjs(day)
            .tz(user?.locationDetails.timezone)
            .startOf('d')
            .add(user?.workingHours.startTime.toString(), 'm')
            .utc(),
          dayjs(day)
            .tz(user?.locationDetails.timezone)
            .startOf('d')
            .add(user?.workingHours.endTime, 'm')
            .utc(),
          'minute',
          '[]'
        )
      ) {
        userCheck = false;
        return userCheck;
      }
    }
  });
  return workingHoursCheck && userCheck;
}
function extractDayName(date) {
  switch (dayjs(date).get('day')) {
    case 0:
      return 'sunday';
      break;
    case 1:
      return 'monday';
      break;
    case 2:
      return 'tuesday';
      break;
    case 3:
      return 'wednesday';
      break;
    case 4:
      return 'thursday';
      break;
    case 5:
      return 'friday';
      break;
    case 6:
      return 'saturday';
      break;
    default:
      break;
  }
}
