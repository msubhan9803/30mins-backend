import {EVENT_STATUS_TYPES} from '../../../../constants/enums';
import Event from '../../../../MongoModels/Event';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getAllEvents() {
  let startLogId: String;

  try {
    const events = await Event.find({eventStatus: {$ne: EVENT_STATUS_TYPES.CANCELLED}}).populate(
      'userId'
    );

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getAllEvents',
      functionParams: [],
      additionalMessage: 'Events Query Successful',
      startLogId,
    });

    return {
      eventsData: events,
      response: {
        message: 'Events Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getAllEvents',
      functionParams: [],
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
