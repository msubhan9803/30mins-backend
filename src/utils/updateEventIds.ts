import dayjs from 'dayjs';
import {google} from 'googleapis';
import Credential from '../MongoModels/Credential';
import _ from 'lodash';
import axios from 'axios';

import decryptObject from './encryption/decryptObject';
import AwsSecrets from './getAwsSecrets';
import createApiLog, {ApiLogTypes, ApiLogLevels} from './createApiLog';

export default async (users, bookedMeeting, selectedTime) => {
  try {
    let result: any;
    const ENV_VALUES = await AwsSecrets.getInstance();
    const encryptedCredentials = await Promise.all(
      users.map(async user => {
        return Credential.find({
          userId: user._id,
          type: {$in: ['office365calendar', 'googlecalendar']},
        });
      })
    );

    let credentials = await Promise.all(
      encryptedCredentials.map(async credential => decryptObject(credential))
    );

    credentials = _.flatten(credentials);
    const officeCredentials = credentials.filter(
      credential => credential.type === 'office365calendar'
    );

    const googleCredentials = credentials.filter(
      credential => credential.type === 'googlecalendar'
    );

    await Promise.all(
      googleCredentials.map(async credential => {
        if (bookedMeeting?.googleCalendarEvent.googleCalendarEventId) {
          const oauth2Client = new google.auth.OAuth2(
            ENV_VALUES.GOOGLE_OAUTH_CLIENT_ID,
            ENV_VALUES.GOOGLE_OAUTH_CLIENT_SECRET,
            ENV_VALUES.GOOGLE_REDIRECT_URL
          );

          oauth2Client.setCredentials(credential.credentials);

          const googleCalendar = google.calendar({
            version: 'v3',
            auth: oauth2Client,
          });

          const response = await googleCalendar.events.list({
            auth: oauth2Client,
            calendarId: 'primary',
            timeMin: bookedMeeting.startTime,
            timeMax: bookedMeeting.endTime,
            timeZone: 'UTC',
          });

          const prevEvent = response.data.items.filter(
            event => event.id === bookedMeeting.googleCalendarEvent.googleCalendarEventId
          )[0];
          const attendees = [
            {email: bookedMeeting.bookerEmail, name: bookedMeeting.bookerName},
            {email: bookedMeeting.providerEmail, name: bookedMeeting.providerName},
          ];

          const res = await googleCalendar.events.update({
            auth: oauth2Client,
            calendarId: 'primary',
            eventId: bookedMeeting.googleCalendarEvent.googleCalendarEventId,
            resource: {
              summary: prevEvent?.summary,
              description: prevEvent?.description,
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
          result = res?.data;
          return res?.data;
        }
      })
    );
    await Promise.all(
      officeCredentials.map(async credential => {
        if (bookedMeeting.officeCalendarEvent.office365CalendarEventId) {
          const params = {
            scope: 'User.Read Calendars.Read Calendars.ReadWrite',
            client_id: ENV_VALUES.MS_GRAPH_CLIENT_ID!,
            refresh_token: officeCredentials[0].credential.refresh_token,
            grant_type: 'refresh_token',
            client_secret: ENV_VALUES.MS_GRAPH_CLIENT_SECRET!,
          };
          const {data: tokenData} = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            new URLSearchParams(params),
            {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
          );
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
          const response = await axios.put(
            'https://graph.microsoft.com/v1.0/me/calendar/getSchedule',
            JSON.stringify(payload),
            {
              headers: {
                Authorization: accessToken,
                'Content-Type': 'application/json',
              },
            }
          );
          return response;
        }
      })
    );
    return result;
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getBusyTimes',
      functionParams: [],
      additionalMessage: err.message,
      startLogId: '',
    });
    throw err;
  }
};
