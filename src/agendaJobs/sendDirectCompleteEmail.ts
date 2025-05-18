import Agenda from 'agenda';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import AwsSecrets from '../utils/getAwsSecrets';

export default async function sendDirectCompleteEmail(agenda: Agenda) {
  try {
    const SECRETS = await AwsSecrets.getInstance();
    agenda.define('sendDirectCompleteEmail', async (job, done) => {
      const {EMAIL_DATA} = job.attrs.data;
      
      await sendEmail(
        EMAIL_DATA,
        SECRETS.ESCROW_30MIN_EMAIL,
        TEMPLATES.POST_BOOKING.PAID_MEETING_COMPLETE_TO_30MIN
      );

      await job.remove();

      done();
    });
  } catch (err) {
    throw err;
  }
}
