import {google} from 'googleapis';
import AwsSecrets from '../getAwsSecrets';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../createApiLog';

export default async function getGoogleBusyTimes(credential, startTime, endTime) {
  try {
    const SECRETS = await AwsSecrets.getInstance();

    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getGoogleBusyTimes',
      functionParams: [
        {
          paramName: 'startTime',
          paramValue: startTime,
          paramType: typeof startTime,
        },
        {
          paramName: 'endTime',
          paramValue: endTime,
          paramType: typeof endTime,
        },
      ],
      additionalMessage: 'GETTING GOOGLE BUSY TIMES',
      startLogId: '',
    });

    const oauth2Client = new google.auth.OAuth2(
      SECRETS.GOOGLE_OAUTH_CLIENT_ID,
      SECRETS.GOOGLE_OAUTH_CLIENT_SECRET
    );

    oauth2Client.setCredentials(credential);

    const googleCalendar = google.calendar({
      version: 'v3',
      auth: oauth2Client,
    });

    const googleStartTime = `${startTime}`;
    const googleEndTime = `${endTime}`;

    return await googleCalendar.freebusy.query({
      requestBody: {
        timeMin: googleStartTime,
        timeMax: googleEndTime,
        items: [
          {
            id: 'primary',
          },
        ],
      },
    });
  } catch (err) {
    throw err;
  }
}
