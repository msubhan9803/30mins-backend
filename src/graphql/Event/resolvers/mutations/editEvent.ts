import Event from '../../../../MongoModels/Event';
import Attendee from '../../../../MongoModels/Attendee';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {EVENT_RECURRING_TYPES} from '../../../../constants/enums';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import dayjs from 'dayjs';

export default async function editEvent(parent, {eventData, documentId, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'editEvent',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'editEvent',
          paramValue: eventData,
          paramType: typeof eventData,
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
      userId: decodedToken.UserId,
      _id: documentId,
    });

    if (!event) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editService',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'editEvent',
            paramValue: eventData,
            paramType: typeof eventData,
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
        message: 'Document Not Found',
        status: 404,
      };
    }

    let eventUpdatesEmailPayload = {
      emailText: '',
      eventTitle: event.serviceTitle,
      eventDateTime: dayjs(event.serviceDateTime).format('ddd, MMM DD, YYYY - hh:mma'),
      eventDescription: event.serviceDescription,
    };
    let shouldSendEmail = false;

    if (eventData.serviceDateTime && eventData.serviceDateTime !== event.serviceDateTime) {
      eventUpdatesEmailPayload.emailText = 'Updates on the new date/time for the event';
      shouldSendEmail = true;
    }

    if (
      eventData.serviceRecurring &&
      eventData.serviceRecurring !== event.serviceRecurring &&
      eventData.serviceRecurring === EVENT_RECURRING_TYPES.NOT_RECURRING
    ) {
      eventUpdatesEmailPayload.emailText = 'Event set to Non-recurring by Organizer';
      shouldSendEmail = true;
    }

    if (shouldSendEmail) {
      const attendees = await Attendee.find({eventId: event._id}).populate('attendeeId');
      attendees.forEach(async attendee => {
        await sendEmail(
          eventUpdatesEmailPayload,
          attendee.attendeeId.accountDetails.email,
          TEMPLATES.EVENT.EMAIL_UPDATES
        );
      });
    }

    Object.assign(event, eventData);

    await event.save();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'editEvent',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'editEvent',
          paramValue: eventData,
          paramType: typeof eventData,
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
      additionalMessage: 'Event Updated Successfully',
      startLogId,
    });

    return {
      message: 'Event Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editEvent',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'eventData',
            paramValue: eventData,
            paramType: typeof eventData,
          },
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
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    if (err?._message === 'Event validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editEvent',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'eventData',
            paramValue: eventData,
            paramType: typeof eventData,
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
        additionalMessage: 'Mongoose Event Validation Failed',
        startLogId,
      });

      return {
        message: err.message,
        status: 400,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'editEvent',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'eventData',
          paramValue: eventData,
          paramType: typeof eventData,
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
      message: err.message,
      status: 500,
    };
  }
}
