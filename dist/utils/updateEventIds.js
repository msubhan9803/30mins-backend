var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dayjs from 'dayjs';
import { google } from 'googleapis';
import Credential from '../MongoModels/Credential';
import _ from 'lodash';
import axios from 'axios';
import decryptObject from './encryption/decryptObject';
import AwsSecrets from './getAwsSecrets';
import createApiLog, { ApiLogTypes, ApiLogLevels } from './createApiLog';
export default (users, bookedMeeting, selectedTime) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result;
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const encryptedCredentials = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            return Credential.find({
                userId: user._id,
                type: { $in: ['office365calendar', 'googlecalendar'] },
            });
        })));
        let credentials = yield Promise.all(encryptedCredentials.map((credential) => __awaiter(void 0, void 0, void 0, function* () { return decryptObject(credential); })));
        credentials = _.flatten(credentials);
        const officeCredentials = credentials.filter(credential => credential.type === 'office365calendar');
        const googleCredentials = credentials.filter(credential => credential.type === 'googlecalendar');
        yield Promise.all(googleCredentials.map((credential) => __awaiter(void 0, void 0, void 0, function* () {
            if (bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.googleCalendarEvent.googleCalendarEventId) {
                const oauth2Client = new google.auth.OAuth2(ENV_VALUES.GOOGLE_OAUTH_CLIENT_ID, ENV_VALUES.GOOGLE_OAUTH_CLIENT_SECRET, ENV_VALUES.GOOGLE_REDIRECT_URL);
                oauth2Client.setCredentials(credential.credentials);
                const googleCalendar = google.calendar({
                    version: 'v3',
                    auth: oauth2Client,
                });
                const response = yield googleCalendar.events.list({
                    auth: oauth2Client,
                    calendarId: 'primary',
                    timeMin: bookedMeeting.startTime,
                    timeMax: bookedMeeting.endTime,
                    timeZone: 'UTC',
                });
                const prevEvent = response.data.items.filter(event => event.id === bookedMeeting.googleCalendarEvent.googleCalendarEventId)[0];
                const attendees = [
                    { email: bookedMeeting.bookerEmail, name: bookedMeeting.bookerName },
                    { email: bookedMeeting.providerEmail, name: bookedMeeting.providerName },
                ];
                const res = yield googleCalendar.events.update({
                    auth: oauth2Client,
                    calendarId: 'primary',
                    eventId: bookedMeeting.googleCalendarEvent.googleCalendarEventId,
                    resource: {
                        summary: prevEvent === null || prevEvent === void 0 ? void 0 : prevEvent.summary,
                        description: prevEvent === null || prevEvent === void 0 ? void 0 : prevEvent.description,
                        start: {
                            dateTime: dayjs(selectedTime).toISOString(),
                            timeZone: 'UTC',
                        },
                        end: {
                            dateTime: dayjs(selectedTime)
                                .add(bookedMeeting.meetingDuration, 'minute')
                                .toISOString(),
                            timeZone: 'UTC',
                        },
                        sendUpdates: 'all',
                        attendees,
                    },
                });
                result = res === null || res === void 0 ? void 0 : res.data;
                return res === null || res === void 0 ? void 0 : res.data;
            }
        })));
        yield Promise.all(officeCredentials.map((credential) => __awaiter(void 0, void 0, void 0, function* () {
            if (bookedMeeting.officeCalendarEvent.office365CalendarEventId) {
                const params = {
                    scope: 'User.Read Calendars.Read Calendars.ReadWrite',
                    client_id: ENV_VALUES.MS_GRAPH_CLIENT_ID,
                    refresh_token: officeCredentials[0].credential.refresh_token,
                    grant_type: 'refresh_token',
                    client_secret: ENV_VALUES.MS_GRAPH_CLIENT_SECRET,
                };
                const { data: tokenData } = yield axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams(params), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
                const accessToken = tokenData.access_token;
                const payload = {
                    schedules: [officeCredentials[0].credential.userEmail],
                    startTime: {
                        dateTime: dayjs(selectedTime).toISOString().replace('Z', ''),
                        timeZone: 'UTC',
                    },
                    endTime: {
                        dateTime: dayjs(selectedTime)
                            .add(bookedMeeting.meetingDuration, 'minutes')
                            .toISOString()
                            .replace('Z', ''),
                        timeZone: 'UTC',
                    },
                    availabilityViewInterval: 60,
                };
                const response = yield axios.put('https://graph.microsoft.com/v1.0/me/calendar/getSchedule', JSON.stringify(payload), {
                    headers: {
                        Authorization: accessToken,
                        'Content-Type': 'application/json',
                    },
                });
                return response;
            }
        })));
        return result;
    }
    catch (err) {
        yield createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.ERROR,
            functionName: 'getBusyTimes',
            functionParams: [],
            additionalMessage: err.message,
            startLogId: '',
        });
        throw err;
    }
});
//# sourceMappingURL=updateEventIds.js.map