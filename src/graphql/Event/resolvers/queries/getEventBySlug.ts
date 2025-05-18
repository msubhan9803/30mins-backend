/* eslint-disable no-await-in-loop */
import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import {
  ATTENDEE_STATUS_TYPES,
  EVENT_RECURRING_TYPES,
  EVENT_STATUS_TYPES,
} from '../../../../constants/enums';
import Attendee from '../../../../MongoModels/Attendee';
import Event from '../../../../MongoModels/Event';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {AccessToken} from '../../../../constants/types';

export default async function getEventBySlug(parent, {slug, token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getEventBySlug',
      functionParams: [
        {
          paramName: 'slug',
          paramValue: slug,
          paramType: typeof slug,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const event = await Event.findOne({
      serviceSlug: slug,
      eventStatus: {$ne: EVENT_STATUS_TYPES.CANCELLED},
    }).populate('userId');

    if (!event) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getEventBySlug',
        functionParams: [
          {
            paramName: 'slug',
            paramValue: slug,
            paramType: typeof slug,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Document Not Found',
        startLogId,
      });

      return {
        response: {
          message: 'Document Not Found',
          status: 404,
        },
      };
    }

    let eventUpcomingDates = [];
    if (event.serviceRecurring !== EVENT_RECURRING_TYPES.NOT_RECURRING) {
      const recurrentType = event.serviceRecurring;
      const interval = recurrentType === EVENT_RECURRING_TYPES.WEEKLY ? 'week' : 'month';
      let eventDateTime = dayjs(event.serviceDateTime);
      const todayDateTime = dayjs();
      let eventPushedCounts = 0;
      while (eventPushedCounts < 4) {
        if (eventDateTime.isSameOrAfter(todayDateTime)) {
          eventUpcomingDates.push({
            eventDateTime: eventDateTime.utc().format(),
            attendeeCount: 0,
            isAttending: false,
          });
          eventPushedCounts += 1;
        }
        eventDateTime = dayjs(eventDateTime).add(1, interval);
      }

      for (let index = 0; index < eventUpcomingDates.length; index++) {
        const eventDateObj = eventUpcomingDates[index];
        const attendees = await Attendee.find({
          eventId: event._id,
          attendingDateTime: eventDateObj.eventDateTime,
          attendeeStatus: ATTENDEE_STATUS_TYPES.REGISTERED,
        });
        const isAttending =
          attendees.findIndex(elem => elem.attendeeId.toString() === decodedToken.UserId) > -1;
        eventUpcomingDates[index].attendeeCount = attendees.length;
        eventUpcomingDates[index].isAttending = isAttending;
      }
    } else {
      const eventDateTime = dayjs(event.serviceDateTime);
      const attendees = await Attendee.find({
        eventId: event._id,
        attendeeStatus: ATTENDEE_STATUS_TYPES.REGISTERED,
      });
      const isAttending =
        attendees.findIndex(elem => elem.attendeeId.toString() === decodedToken.UserId) > -1;
      eventUpcomingDates.push({
        eventDateTime: eventDateTime.utc().format(),
        attendeeCount: attendees.length,
        isAttending,
      });
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getEventBySlug',
      functionParams: [
        {
          paramName: 'slug',
          paramValue: slug,
          paramType: typeof slug,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Event Query Successful',
      startLogId,
    });

    return {
      eventData: event,
      eventUpcomingDates,
      response: {
        message: 'Event Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getEventById',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
        startLogId,
      });

      return {
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
      functionName: 'getEventBySlug',
      functionParams: [
        {
          paramName: 'slug',
          paramValue: slug,
          paramType: typeof slug,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
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
