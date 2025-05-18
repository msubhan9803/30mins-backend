var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import updateEventIds from '../../../../utils/updateEventIds';
import jwt from 'jsonwebtoken';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import User from '../../../../MongoModels/User';
import dayjs from 'dayjs';
import agenda from '../../../../lib/agenda';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import getBusyTimes from '../../../../utils/busyTimes/getBusyTimes';
import { cancelAgendaWithBookingId } from '../../../../utils/booking/agendaHelpers';
export default function rescheduleMeeting(parent, { meetingId, selectedTime, rescheduleMeetingReason, }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let decodedToken;
        const selectedTimeObj = dayjs(selectedTime);
        let startLogId;
        try {
            decodedToken = jwt.verify(token, accessTokenSecret);
        }
        catch (err) {
            yield createApiLog({
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
            startLogId = yield createApiLog({
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
                yield createApiLog({
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
            const bookedMeeting = yield BookedMeeting.findById(meetingId);
            if (decodedToken.UserId !== (bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.provider.toString()) &&
                decodedToken.UserId !== (bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.booker.toString())) {
                yield createApiLog({
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
            const providerUser = yield User.findById(bookedMeeting.provider, [
                '_id',
                'locationDetails.timezone',
                'accountDetails.activeExtensions',
                'personalDetails.language',
            ]);
            if (!providerUser) {
                yield createApiLog({
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
            const availabilities = yield getBusyTimes([{ _id: providerUser._id }], selectedTime, dayjs(selectedTime).add(bookedMeeting.meetingDuration, 'minute').toISOString());
            let isNotAvailable = false;
            availabilities.forEach(bookingTime => {
                if (selectedTimeObj.isBetween(dayjs(bookingTime.start), dayjs(bookingTime.end), null, '[]')) {
                    isNotAvailable = true;
                }
            });
            if (isNotAvailable) {
                yield createApiLog({
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
                    response: { message: 'The Slot Is Already Booked!', status: 404 },
                };
            }
            let updatedBooking = yield BookedMeeting.findByIdAndUpdate(meetingId, {
                $set: {
                    meetingDate: selectedTimeObj.toISOString(),
                    startTime: dayjs(selectedTime).toISOString(),
                    endTime: dayjs(selectedTime).add(bookedMeeting.meetingDuration, 'minute').toISOString(),
                    'status.rescheduleMeeting': true,
                    'status.rescheduleMeetingReason': rescheduleMeetingReason,
                },
            }, { returnDocument: 'after' });
            const updatedEvents = yield updateEventIds([{ _id: bookedMeeting.provider }, { _id: bookedMeeting.booker }], bookedMeeting, selectedTime);
            const agendaInstance = yield agenda.getInstance();
            yield cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, ['sendFollowUpEmail']);
            yield cancelAgendaWithBookingId(bookedMeeting._id, agendaInstance, [
                'sendAutomaticMeetingComplete',
            ]);
            updatedBooking = updatedBooking._doc;
            const bookingId = updatedBooking._id;
            delete updatedBooking._id;
            const followupTime = dayjs(updatedBooking.endTime).add(15, 'minute').toDate();
            yield agendaInstance.schedule(followupTime, 'sendFollowUpEmail', Object.assign({ bookingId: bookingId }, updatedBooking));
            yield agendaInstance.schedule(dayjs(updatedBooking.endTime).add(3, 'day').toDate(), 'sendAutomaticMeetingComplete', {
                bookingId: bookingId,
                bookerName: updatedBooking.bookerName,
                bookerEmail: updatedBooking.bookerEmail,
                providerName: updatedBooking.providerName,
                providerEmail: updatedBooking.providerEmail,
                conferenceType: updatedBooking.conferenceType,
                startTime: updatedBooking.startTime,
                endTime: updatedBooking.endTime,
                meetingDuration: updatedBooking.meetingDuration,
            });
            yield createApiLog({
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
                meetingLink: updatedEvents === null || updatedEvents === void 0 ? void 0 : updatedEvents.hangoutLink,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'BookedMeeting validation failed') {
                yield createApiLog({
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
            yield createApiLog({
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
    });
}
//# sourceMappingURL=rescheduleMeeting.js.map