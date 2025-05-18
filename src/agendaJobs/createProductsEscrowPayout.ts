import Agenda from 'agenda';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';
import PendingPayout from '../MongoModels/PendingPayout';

export default async function createProductsEscrowPayout(agenda: Agenda) {
  agenda.define('createProductsEscrowPayout', async (job, done) => {
    try {
      const {payoutData} = job.attrs.data;

      await createApiLog({
        type: ApiLogTypes.API_PROCESSING_END,
        level: ApiLogLevels.INFO,
        functionName: 'createProductsEscrowPayout',
        functionParams: [
          {
            paramName: 'payoutData',
            paramValue: payoutData,
            paramType: typeof payoutData,
          },
        ],
        additionalMessage: JSON.stringify(job.attrs.data),
        startLogId: ``,
      });

      const pendingPayout = await PendingPayout.create(payoutData);
      await pendingPayout.save();

      await job.remove();
      done();
    } catch (err) {
      await createApiLog({
        type: ApiLogTypes.API_PROCESSING_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createProductsEscrowPayout',
        functionParams: [],
        additionalMessage: err.message,
        startLogId: ``,
      });
      throw err;
    }
  });
}
