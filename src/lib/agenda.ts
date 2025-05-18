import {Agenda} from 'agenda';
import send15MinReminder from '../agendaJobs/send15MinReminder';
import send24HrReminder from '../agendaJobs/send24HrReminder';
import sendDirectCompleteEmail from '../agendaJobs/sendDirectCompleteEmail';
import sendEscrowReleaseEmail from '../agendaJobs/sendEscrowReleaseEmail';
import sendFollowUpEmail from '../agendaJobs/sendFollowupEmail';
import updateSitemaps from '../agendaJobs/updateSitemaps';
import AwsSecrets from '../utils/getAwsSecrets';
import send24HrFreelanceReminder from '../agendaJobs/send24HrFreelanceReminder';
import send24HrDelayedFreelanceReminder from '../agendaJobs/send24HrDelayedFreelanceReminder';
import sendAutomaticMeetingComplete from '../agendaJobs/sendAutomaticMeetingComplete';
import autoConcludeEvent from '../agendaJobs/autoConcludeEvent';
import send24HrEventReminder from '../agendaJobs/send24HrEventReminder';
import send15MinEventReminder from '../agendaJobs/send15MinEventReminder';

const AgendaObj = (() => {
  let instance: Agenda;
  let sitemapInstance;

  const getdbURI = async () => {
    const SECRETS = await AwsSecrets.getInstance();
    return `mongodb://${SECRETS.DATABASE_USER}:${SECRETS.DATABASE_PASSWORD}@${SECRETS.DATABASE_IP}:${SECRETS.DATABASE_PORT}/${SECRETS.DATABASE_NAME}`;
  };

  const createInstance = async () => {
    const dbURI = await getdbURI();
    const agenda = new Agenda({
      db: {address: dbURI, collection: 'agendaJobs'},
      processEvery: '30 seconds',
    });

    // Define Agenda Jobs
    await (async () => {
      await send15MinReminder(agenda);
      await send24HrReminder(agenda);
      await sendEscrowReleaseEmail(agenda);
      await sendFollowUpEmail(agenda);
      await sendDirectCompleteEmail(agenda);
      await send24HrFreelanceReminder(agenda);
      await send24HrDelayedFreelanceReminder(agenda);
      await sendAutomaticMeetingComplete(agenda);
      await autoConcludeEvent(agenda);
      await send24HrEventReminder(agenda);
      await send15MinEventReminder(agenda);
    })();
    return agenda;
  };

  const createSitemapInstance = async () => {
    const dbURI = await getdbURI();
    const sitemapAgenda = new Agenda({
      db: {address: dbURI, collection: 'agendaJobs'},
      processEvery: '24 hours',
    });

    // Define Agenda Jobs
    await (async () => {
      await updateSitemaps(sitemapAgenda);
    })();

    sitemapAgenda.on('ready', () => {
      sitemapAgenda.every('24 hours', 'updateSitemaps');
    });

    return sitemapAgenda;
  };

  return {
    getInstance: async () => {
      if (!instance) {
        instance = await createInstance();
      }
      return instance;
    },
    getSitemapInstance: async () => {
      if (!sitemapInstance) {
        sitemapInstance = await createSitemapInstance();
      }
      return sitemapInstance;
    },
  };
})();

export default AgendaObj;
