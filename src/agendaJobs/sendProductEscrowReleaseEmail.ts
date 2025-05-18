import Agenda from 'agenda';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';

export default async function sendProductEscrowReleaseEmail(agenda: Agenda) {
  agenda.define('sendProductEscrowReleaseEmail', async (job, done) => {
    try {
      const {emailData, emailSendTo} = job.attrs.data;

      await createApiLog({
        type: ApiLogTypes.API_PROCESSING_END,
        level: ApiLogLevels.INFO,
        functionName: 'sendProductEscrowReleaseEmail',
        functionParams: [
          {
            paramName: 'emailData',
            paramValue: emailData,
            paramType: typeof emailData,
          },
        ],
        additionalMessage: JSON.stringify(job.attrs.data),
        startLogId: ``,
      });

      await sendEmail(
        {
          ...emailData,
        },
        emailSendTo,
        TEMPLATES.PRODUCT.PRODUCT_RELEASE_ESCROW_TO_30MIN
      );

      await job.remove();
      done();
    } catch (err) {
      await createApiLog({
        type: ApiLogTypes.API_PROCESSING_END,
        level: ApiLogLevels.ERROR,
        functionName: 'sendProductEscrowReleaseEmail',
        functionParams: [],
        additionalMessage: err.message,
        startLogId: ``,
      });
      throw err;
    }
  });
}
