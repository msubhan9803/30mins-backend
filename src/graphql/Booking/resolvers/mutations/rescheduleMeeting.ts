import updateEventIds from '../../../../utils/updateEventIds';
import jwt from 'jsonwebtoken';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import User from '../../../../MongoModels/User';
import dayjs from 'dayjs';
import agenda from '../../../../lib/agenda';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import getBusyTimes from '../../../../utils/busyTimes/getBusyTimes';
import {AccessToken} from '../../../../constants/types';
import {cancelAgendaWithBookingId} from '../../../../utils/booking/agendaHelpers';

export default async function rescheduleMeeting(
  parent,
  {
    meetingId,
    selectedTime,
    rescheduleMeetingReason,
  }: {meetingId: string; selectedTime: string; rescheduleMeetingReason: string},
  context
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let decodedToken: any;
  const selectedTimeObj = dayjs(selectedTime);

  let startLogId: String;
  try {
    decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'rescheduleMeeting',
      functionParams: [
        {
          paramName: 'meetingId',
          paramValue: meetingId,
          paramType: typeof meetingId,
        },
        {
          paramName: 'SelectedTime ',
          paramValue: selectedTime,
          paramType: typeof selectedTime,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: 'Not Authorized',
      status: 401,
    };
  }

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'rescheduleMeeting',
      functionParams: [
        {
          paramName: 'meetingId',
          paramValue: meetingId,
          paramType: typeof meetingId,
        },
        {
          paramName: 'SelectedTime ',
          paramValue: selectedTime,
          paramType: typeof selectedTime,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
      ],
    });
    if (!selectedTimeObj.isAfter(dayjs())) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'rescheduleMeeting',
        functionParams: [
          {
            paramName: 'meetingId',
            paramValue: meetingId,
            paramType: typeof meetingId,
          },
          {
            paramName: 'SelectedTime ',
            paramValue: selectedTime,
            paramType: typeof selectedTime,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
        ],
        additionalMessage: 'Provider Not Found',
        startLogId,
      });

      return {
        response: {
          message: 'Time has already passed!',
          status: 400,
        },
      };
    }

    const bookedMeeting = await BookedMeeting.findById(meetingId);
    if (
      decodedToken.UserId !== bookedMeeting?.provider.toString() &&
      decodedToken.UserId !== bookedMeeting?.booker.toString()
    ) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'rescheduleMeeting',
        functionParams: [
          {
            paramName: 'meetingId',
            paramValue: meetingId,
            paramType: typeof meetingId,
          },
          {
            paramName: 'SelectedTime ',
            paramValue: selectedTime,
            paramType: typeof selectedTime,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
        ],
        additionalMessage: 'Not Authorized: Only Provider or Booker Can Reschedule!',
        startLogId,
      });

      return {
        response: {
          message: 'Not Authorized: Only Provider or Booker Can Reschedule!',
          status: 401,
        },
      };
    }
    const providerUser = await User.findById(bookedMeeting.provider, [
      '_id',
      'locationDetails.timezone',
      'accountDetails.activeExtensions',
      'personalDetails.language',
    ]);

    if (!providerUser) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'rescheduleMeeting',
        functionParams: [
          {
            paramName: 'meetingId',
            paramValue: meetingId,
            paramType: typeof meetingId,
          },
          {
            paramName: 'SelectedTime ',
            paramValue: selectedTime,
            paramType: typeof selectedTime,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
        ],
        additionalMessage: 'Provider Not Found!',
        startLogId,
      });

      return {
        response: {
          message: 'Provider Not Found!',
          status: 404,
        },
      };
    }

    const availabilities = await getBusyTimes(
      [{_id: providerUser._id}],
      selectedTime,
      dayjs(selectedTime).add(bookedMeeting.meetingDuration, 'minute').toISOString()
    );

    let isNotAvailable: Boolean = false;
    availabilities.forEach(bookingTime => {
      if (selectedTimeObj.isBetween(dayjs(bookingTime.start), dayjs(bookingTime.end), null, '[]')) {
        isNotAvailable = true;
      }
    });

    if (isNotAvailable) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'rescheduleMeeting',
        functionParams: [
          {
            paramName: 'meetingId',
            paramValue: meetingId,
            paramType: typeof meetingId,
          },
          {
            paramName: 'SelectedTime ',
            paramValue: selectedTime,
            paramType: typeof selectedTime,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
        ],
        additionalMessage: 'The Slot Is Already Booked!',
        startLogId,
      });

      return {
        response: {message: 'The Slot Is Already Booked!', status: 404},
      };
    }

    let updatedBooking = await BookedMeeting.findByIdAndUpdate(
      meetingId,
      {
        $set: {
          meetingDate: selectedTimeObj.toISOString(),
          startTime: dayjs(selectedTime).toISOString(),
          endTime: dayjs(selectedTime).add(bookedMeeting.meetingDuration, 'minute').toISOString(),
          'status.rescheduleMeeting': true,
          'status.rescheduleMeetingReason': rescheduleMeetingReason,
        },
      },
      {returnDocument: 'after'}
    );
    const updatedEvents = await updateEventIds(
      [{_id: bookedMeeting.provider}, {_id: bookedMeeting.booker}],
      bookedMeeting,
      selectedTime
    );
    const agendaInstance = await agenda.getInstance();
    await cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, ['sendFollowUpEmail']);
    await cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
      'sendAutomaticMeetingComplete',
    ]);
    updatedBooking = updatedBooking._doc;
    const bookingId = updatedBooking._id;
    delete updatedBooking._id;
    const followupTime = dayjs(updatedBooking.endTime).add(15, 'minute').toDate();
    await agendaInstance.schedule(followupTime, 'sendFollowUpEmail', {
      bookingId: bookingId,
      ...updatedBooking,
    });
    await agendaInstance.schedule(
      dayjs(updatedBooking.endTime).add(3, 'day').toDate(),
      'sendAutomaticMeetingComplete',
      {
        bookingId: bookingId,
        bookerName: updatedBooking.bookerName,
        bookerEmail: updatedBooking.bookerEmail,
        providerName: updatedBooking.providerName,
        providerEmail: updatedBooking.providerEmail,
        conferenceType: updatedBooking.conferenceType,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        meetingDuration: updatedBooking.meetingDuration,
      }
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'rescheduleMeeting',
      functionParams: [
        {
          paramName: 'meetingId',
          paramValue: meetingId,
          paramType: typeof meetingId,
        },
        {
          paramName: 'SelectedTime ',
          paramValue: selectedTime,
          paramType: typeof selectedTime,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
        },
      ],
      additionalMessage: 'Meeting rescheduled Successfully',
      startLogId,
    });

    return {
      response: {
        message: 'Meeting rescheduled Successfully',
        status: 200,
      },
      meetingLink: updatedEvents?.hangoutLink,
    };
  } catch (err) {
    if (err?._message === 'BookedMeeting validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'rescheduleMeeting',
        functionParams: [
          {
            paramName: 'meetingId',
            paramValue: meetingId,
            paramType: typeof meetingId,
          },
          {
            paramName: 'SelectedTime ',
            paramValue: selectedTime,
            paramType: typeof selectedTime,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof context.token,
          },
        ],
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
      functionName: 'rescheduleMeeting',
      functionParams: [
        {
          paramName: 'meetingId',
          paramValue: meetingId,
          paramType: typeof meetingId,
        },
        {
          paramName: 'SelectedTime ',
          paramValue: selectedTime,
          paramType: typeof selectedTime,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof context.token,
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
