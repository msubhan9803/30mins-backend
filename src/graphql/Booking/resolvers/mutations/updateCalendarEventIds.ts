import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';

import BookedMeeting from '../../../../MongoModels/BookedMeeting';

export default async function updateCalendarEventIds(parent, {bookingId, events}, context, info) {
  const {token} = context;
  const SECRETS = await AwsSecrets.getInstance();

  let startLogId: String;
  const functionParams = [
    {
      paramName: 'bookingId',
      paramValue: bookingId,
      paramType: typeof bookingId,
    },
    {
      paramName: 'events',
      paramValue: events,
      paramType: typeof events,
    },
    {
      paramName: 'token',
      paramValue: 'HIDDEN_TOKEN',
      paramType: typeof token,
    },
  ];
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateCalendarEventIds',
      functionParams: functionParams,
    });
    if (context.token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateCalendarEventIds',
        functionParams,
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    const data: any = {$set: {}};
    if (events.google) {
      data.$set.googleCalendarEvent = events?.google;
    }
    if (events.office) {
      data.$set.officeCalendarEvent = events?.office;
    }
    await BookedMeeting.findByIdAndUpdate(
      bookingId,
      {
        ...data,
      },
      ['_id']
    ).orFail(() => {
      throw new Error('Document not Found!');
    });

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateCalendarEventIds',
      functionParams: functionParams,
      additionalMessage: 'Events Added successfully!',
      startLogId,
    });

    return {
      message: 'Events Added successfully!',
      status: 200,
    };
  } catch (err) {
    if (err?._message === 'BookedMeeting validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateCalendarEventIds',
        functionParams,
        additionalMessage: 'Mongoose BookedMeeting Validation Failed',
        startLogId,
      });

      return {
        response: {
          message: err.message,
          status: 400,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'updateCalendarEventIds',
      functionParams,
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
