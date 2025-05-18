var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import _ from 'lodash';
import Credential from '../../MongoModels/Credential';
import decryptObject from '../encryption/decryptObject';
import getGoogleBusyTimes from './getGoogleBusyTimes';
import getOfficeBusyTimes from './getOfficeBusyTimes';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../createApiLog';
export default function getBusyTimes(users, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const encryptedCredentials = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                return Credential.find({
                    userId: user._id,
                    type: { $in: ['office365calendar', 'googlecalendar'] },
                });
            })));
            let credentials = yield Promise.all(encryptedCredentials.map((credential) => __awaiter(this, void 0, void 0, function* () { return decryptObject(credential); })));
            credentials = _.flatten(credentials);
            const officeCredentials = credentials.filter(credential => credential.type === 'office365calendar');
            const googleCredentials = credentials.filter(credential => credential.type === 'googlecalendar');
            const googleBusyTimes = yield Promise.all(googleCredentials.map((credential) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const busyData = yield getGoogleBusyTimes(credential.credentials, startTime, endTime);
                return (_a = busyData.data.calendars) === null || _a === void 0 ? void 0 : _a.primary.busy;
            })));
            const officeBusyTimes = yield Promise.all(officeCredentials.map((credential) => __awaiter(this, void 0, void 0, function* () { return getOfficeBusyTimes(credential, startTime, endTime); })));
            const flatGoogleBusyTimes = _.flatten(googleBusyTimes);
            const flatOfficeBusyTimes = _.flatten(officeBusyTimes);
            return _.union(flatGoogleBusyTimes, flatOfficeBusyTimes);
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
}
//# sourceMappingURL=getBusyTimes.js.map