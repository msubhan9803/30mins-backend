var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { google } from 'googleapis';
import AwsSecrets from '../getAwsSecrets';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../createApiLog';
export default function getGoogleBusyTimes(credential, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            yield createApiLog({
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
            const oauth2Client = new google.auth.OAuth2(SECRETS.GOOGLE_OAUTH_CLIENT_ID, SECRETS.GOOGLE_OAUTH_CLIENT_SECRET);
            oauth2Client.setCredentials(credential);
            const googleCalendar = google.calendar({
                version: 'v3',
                auth: oauth2Client,
            });
            const googleStartTime = `${startTime}`;
            const googleEndTime = `${endTime}`;
            return yield googleCalendar.freebusy.query({
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
        }
        catch (err) {
            throw err;
        }
    });
}
//# sourceMappingURL=getGoogleBusyTimes.js.map