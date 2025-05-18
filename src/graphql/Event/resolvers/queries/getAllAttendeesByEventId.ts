import {EVENT_STATUS_TYPES} from '../../../../constants/enums';
import Attendee from '../../../../MongoModels/Attendee';
import Event from '../../../../MongoModels/Event';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getAllAttendeesByEventId(parent, {eventId}) {
  let startLogId: String;

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getAllAttendeesByEventId',
      functionParams: [
        {
          paramName: 'eventId',
          paramValue: eventId,
          paramType: typeof eventId,
        },
      ],
    });

    const attendees = await Attendee.find({eventId}).populate('attendeeId').populate('eventId');
    const event = await Event.findOne({
      _id: eventId,
      eventStatus: {$ne: EVENT_STATUS_TYPES.CANCELLED},
    }).populate('userId');

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getAllAttendeesByEventId',
      functionParams: [
        {
          paramName: 'eventId',
          paramValue: eventId,
          paramType: typeof eventId,
        },
      ],
      additionalMessage: 'Attendees Query Successful',
      startLogId,
    });

    return {
      attendees,
      eventData: event,
      response: {
        message: 'Attendees Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getAllAttendeesByEventId',
      functionParams: [
        {
          paramName: 'eventId',
          paramValue: eventId,
          paramType: typeof eventId,
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
