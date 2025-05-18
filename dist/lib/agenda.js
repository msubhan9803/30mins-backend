var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Agenda } from 'agenda';
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
    let instance;
    let sitemapInstance;
    const getdbURI = () => __awaiter(void 0, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        return `mongodb://${SECRETS.DATABASE_USER}:${SECRETS.DATABASE_PASSWORD}@${SECRETS.DATABASE_IP}:${SECRETS.DATABASE_PORT}/${SECRETS.DATABASE_NAME}`;
    });
    const createInstance = () => __awaiter(void 0, void 0, void 0, function* () {
        const dbURI = yield getdbURI();
        const agenda = new Agenda({
            db: { address: dbURI, collection: 'agendaJobs' },
            processEvery: '30 seconds',
        });
        // Define Agenda Jobs
        yield (() => __awaiter(void 0, void 0, void 0, function* () {
            yield send15MinReminder(agenda);
            yield send24HrReminder(agenda);
            yield sendEscrowReleaseEmail(agenda);
            yield sendFollowUpEmail(agenda);
            yield sendDirectCompleteEmail(agenda);
            yield send24HrFreelanceReminder(agenda);
            yield send24HrDelayedFreelanceReminder(agenda);
            yield sendAutomaticMeetingComplete(agenda);
            yield autoConcludeEvent(agenda);
            yield send24HrEventReminder(agenda);
            yield send15MinEventReminder(agenda);
        }))();
        return agenda;
    });
    const createSitemapInstance = () => __awaiter(void 0, void 0, void 0, function* () {
        const dbURI = yield getdbURI();
        const sitemapAgenda = new Agenda({
            db: { address: dbURI, collection: 'agendaJobs' },
            processEvery: '24 hours',
        });
        // Define Agenda Jobs
        yield (() => __awaiter(void 0, void 0, void 0, function* () {
            yield updateSitemaps(sitemapAgenda);
        }))();
        sitemapAgenda.on('ready', () => {
            sitemapAgenda.every('24 hours', 'updateSitemaps');
        });
        return sitemapAgenda;
    });
    return {
        getInstance: () => __awaiter(void 0, void 0, void 0, function* () {
            if (!instance) {
                instance = yield createInstance();
            }
            return instance;
        }),
        getSitemapInstance: () => __awaiter(void 0, void 0, void 0, function* () {
            if (!sitemapInstance) {
                sitemapInstance = yield createSitemapInstance();
            }
            return sitemapInstance;
        }),
    };
})();
export default AgendaObj;
//# sourceMappingURL=agenda.js.map