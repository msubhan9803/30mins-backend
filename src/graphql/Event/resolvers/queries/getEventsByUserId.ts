import {EVENT_STATUS_TYPES} from '../../../../constants/enums';
import Event from '../../../../MongoModels/Event';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getEventsByUserId(parent, {userId}) {
  let startLogId: String;

  try {
    const events = await Event.find({
      userId,
      eventStatus: {$ne: EVENT_STATUS_TYPES.CANCELLED},
    }).populate('userId');

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getEventsByUserId',
      functionParams: [
        {
          paramName: 'userId',
          paramValue: userId,
          paramType: typeof userId,
        },
      ],
      additionalMessage: 'Event Query Successful',
      startLogId,
    });

    return {
      eventsData: events,
      response: {
        message: 'Event Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getEventsByUserId',
      functionParams: [
        {
          paramName: 'userId',
          paramValue: userId,
          paramType: typeof userId,
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
