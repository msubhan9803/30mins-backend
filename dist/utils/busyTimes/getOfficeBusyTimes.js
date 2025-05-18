var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import AwsSecrets from '../getAwsSecrets';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../createApiLog';
import dayjs from 'dayjs';
import Credential from '../../MongoModels/Credential';
import encrypt from '../encryption/encrypt';
const getOfficeBusyTimes = (credential, startTime, endTime) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const SECRETS = yield AwsSecrets.getInstance();
        yield createApiLog({
            type: ApiLogTypes.API_PROCESSING_END,
            level: ApiLogLevels.ERROR,
            functionName: 'getOfficeBusyTimes',
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
            additionalMessage: 'GETTING OFFICE BUSY TIMES',
            startLogId: '',
        });
        const params = {
            scope: 'User.Read Calendars.Read Calendars.ReadWrite offline_access',
            client_id: SECRETS.MS_GRAPH_CLIENT_ID,
            refresh_token: credential.credentials.refresh_token,
            grant_type: 'refresh_token',
            client_secret: SECRETS.MS_GRAPH_CLIENT_SECRET,
        };
        const { data: tokenData } = yield axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams(params), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const encryptedRefreshToken = yield encrypt(refreshToken, SECRETS.ENCRYPTION_SECRET);
        yield Credential.findByIdAndUpdate(credential._id, {
            $set: {
                'credentials.refresh_token': encryptedRefreshToken,
            },
        });
        startTime = startTime.replace('Z', '');
        endTime = endTime.replace('Z', '');
        const payload = {
            schedules: [credential.userEmail],
            startTime: {
                dateTime: startTime,
                timeZone: 'UTC',
            },
            endTime: {
                dateTime: endTime,
                timeZone: 'UTC',
            },
            availabilityViewInterval: 5,
        };
        const response = yield axios.post('https://graph.microsoft.com/v1.0/me/calendar/getSchedule', JSON.stringify(payload), {
            headers: {
                Authorization: accessToken,
                'Content-Type': 'application/json',
            },
        });
        // Format response data and return
        return response.data.value[0].scheduleItems.map(item => ({
            start: dayjs(item.start.dateTime).utc(true).toISOString(),
            end: dayjs(item.end.dateTime).utc(true).toISOString(),
        }));
    }
    catch (err) {
        throw err;
    }
});
export default getOfficeBusyTimes;
//# sourceMappingURL=getOfficeBusyTimes.js.map