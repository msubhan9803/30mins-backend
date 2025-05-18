import _ from 'lodash';
import Credential from '../../MongoModels/Credential';

import decryptObject from '../encryption/decryptObject';
import getGoogleBusyTimes from './getGoogleBusyTimes';
import getOfficeBusyTimes from './getOfficeBusyTimes';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../createApiLog';

export default async function getBusyTimes(users, startTime, endTime) {
  try {
    const encryptedCredentials = await Promise.all(
      users.map(async user =>
        Credential.find({
          userId: user._id,
          type: {$in: ['office365calendar', 'googlecalendar']},
        })
      )
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

    const googleBusyTimes = await Promise.all(
      googleCredentials.map(async credential => {
        const busyData = await getGoogleBusyTimes(credential.credentials, startTime, endTime);
        return busyData.data.calendars?.primary.busy;
      })
    );

    const officeBusyTimes = await Promise.all(
      officeCredentials.map(async credential => getOfficeBusyTimes(credential, startTime, endTime))
    );

    const flatGoogleBusyTimes = _.flatten(googleBusyTimes);
    const flatOfficeBusyTimes = _.flatten(officeBusyTimes);

    return _.union(flatGoogleBusyTimes, flatOfficeBusyTimes);
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
}
