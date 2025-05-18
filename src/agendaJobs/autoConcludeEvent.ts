/* eslint-disable no-useless-catch */
import Agenda from 'agenda';
import Event from '../MongoModels/Event';
import {EVENT_STATUS_TYPES} from '../constants/enums';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';

export default async function autoConcludeEvent(agenda: Agenda) {
  let eventIdVal;
  try {
    agenda.define('autoConcludeEvent', async (job, done) => {
      console.log('autoConcludeEvent job started ...');
      eventIdVal = job.attrs.data.eventId;
      const {eventId} = job.attrs.data;

      try {
        await createApiLog({
          type: ApiLogTypes.API_PROCESSING_START,
          level: ApiLogLevels.INFO,
          functionName: 'autoConcludeEvent',
          functionParams: [
            {
              paramName: 'eventId',
              paramValue: eventId,
              paramType: typeof eventId,
            },
          ],
          additionalMessage: JSON.stringify(job.attrs.data),
          startLogId: `EVENT_ID ${eventId}`,
        });
        const event = await Event.findById(eventId);

        event.eventStatus = EVENT_STATUS_TYPES.CONCLUDED;
        await event.save();

        await job.remove();
        done();
      } catch (err) {
        await createApiLog({
          type: ApiLogTypes.API_PROCESSING_END,
          level: ApiLogLevels.ERROR,
          functionName: 'autoConcludeEvent',
          functionParams: [
            {
              paramName: 'eventId',
              paramValue: eventId,
              paramType: typeof eventId,
            },
          ],
          additionalMessage: err.message,
          startLogId: `EVENT_ID ${eventId}`,
        });
      }
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'autoConcludeEvent',
      functionParams: [],
      additionalMessage: err.message,
      startLogId: `EVENT_ID ${eventIdVal}`,
    });
    throw err;
  }
}
