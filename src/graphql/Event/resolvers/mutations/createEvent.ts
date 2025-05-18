import Event from '../../../../MongoModels/Event';
import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import escapeStringRegexp from 'escape-string-regexp';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import agenda from '../../../../lib/agenda';
import {EVENT_RECURRING_TYPES} from '../../../../constants/enums';

export default async function createEvent(parent, {eventData, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createEvent',
      functionParams: [
        {
          paramName: 'createEvent',
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

    const {
      serviceType,
      serviceTitle,
      serviceDuration,
      serviceAttendeeLimit,
      serviceSlug,
      serviceDateTime,
      serviceRecurring,
      serviceDescription,
      isPublic,
      serviceAttendeesMessage,
      searchTags,
      serviceQuestions,
      serviceQuestionsList,
      eventStatus,
      serviceImage,
      serviceMedia,
      otpProtected,
      authenticationType,
    } = eventData;

    const safeSlug = escapeStringRegexp(serviceSlug);
    const pattern = `^${safeSlug}$`;
    const regex = new RegExp(pattern, 'i');

    const dupeSlug = await Event.exists({
      userId: decodedToken.UserId,
      serviceSlug: {$regex: regex},
    });

    if (dupeSlug) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createEvent',
        functionParams: [
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
        additionalMessage: 'This slug is being used by another service currently.',
        startLogId,
      });

      return {
        message: 'This slug is being used by another service currently.',
        status: 409,
      };
    }

    const createdEvent = await Event.create({
      userId: decodedToken.UserId,
      serviceType,
      serviceTitle,
      serviceDuration,
      serviceAttendeeLimit,
      serviceSlug,
      serviceDateTime,
      serviceRecurring,
      serviceDescription,
      isPublic,
      serviceAttendeesMessage,
      searchTags,
      serviceQuestions,
      serviceQuestionsList,
      eventStatus,
      serviceImage,
      otpProtected,
      authenticationType,
      'serviceMedia.type': serviceMedia?.type,
      'serviceMedia.link': serviceMedia?.link,
      serviceTitleOriginal: serviceTitle,
      serviceSlugOriginal: serviceSlug,
    });

    await User.findByIdAndUpdate(decodedToken.UserId, {
      $push: {
        events: createdEvent._id,
      },
    })
      .orFail(() => new Error('User Document Not Found'))
      .exec();

    if (serviceRecurring === EVENT_RECURRING_TYPES.NOT_RECURRING) {
      const agendaInstance = await agenda.getInstance();
      const scheduledTime = dayjs(serviceDateTime).add(serviceDuration, 'minute').toDate();

      await agendaInstance.schedule(scheduledTime, 'autoConcludeEvent', {
        eventId: createdEvent._id,
      });
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createEvent',
      functionParams: [
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
      additionalMessage: 'Service Created Successfully',
      startLogId,
    });

    return {
      message: 'Event Created Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createEvent',
        functionParams: [
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
        functionName: 'createEvent',
        functionParams: [
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
      functionName: 'createEvent',
      functionParams: [
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
