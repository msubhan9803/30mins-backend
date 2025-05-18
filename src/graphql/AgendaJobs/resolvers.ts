import agenda from '../../lib/agenda';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../utils/createApiLog';
import AwsSecrets from '../../utils/getAwsSecrets';

const queries = {};

const mutations = {
  scheduleAgendaJob: async (parent, {agendaJobData}, context, info) => {
    let startLogId: String;
    const {jobName, scheduledDate, jobData} = agendaJobData;
    try {
      const {token} = context;
      const SECRETS = await AwsSecrets.getInstance();

      if (token !== SECRETS.BACKEND_API_KEY) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'scheduleAgendaJob',
          functionParams: [
            {
              paramName: 'jobName',
              paramValue: jobName,
              paramType: typeof jobName,
            },

            {
              paramName: 'scheduledDate',
              paramValue: scheduledDate,
              paramType: typeof scheduledDate,
            },
            {
              paramName: 'jobData',
              paramValue: jobData,
              paramType: typeof jobData,
            },
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
          ],
          additionalMessage: 'Invalid Permissions: Invalid API Key',
        });

        return {
          message: 'Not Authenticated',
          status: 401,
        };
      }

      startLogId = await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.INFO,
        functionName: 'scheduleAgendaJob',
        functionParams: [
          {
            paramName: 'jobName',
            paramValue: jobName,
            paramType: typeof jobName,
          },

          {
            paramName: 'scheduledDate',
            paramValue: scheduledDate,
            paramType: typeof scheduledDate,
          },
          {
            paramName: 'jobData',
            paramValue: jobData,
            paramType: typeof jobData,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: `Job "${jobName}" Scheduled Successfully`,
      });
      const agendaInstance = await agenda.getInstance();

      await agendaInstance.schedule(scheduledDate, jobName, jobData);

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'scheduleAgendaJob',
        functionParams: [
          {
            paramName: 'jobName',
            paramValue: jobName,
            paramType: typeof jobName,
          },

          {
            paramName: 'scheduledDate',
            paramValue: scheduledDate,
            paramType: typeof scheduledDate,
          },
          {
            paramName: 'jobData',
            paramValue: jobData,
            paramType: typeof jobData,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: `Job "${jobName}" Scheduled Successfully`,
        startLogId,
      });

      return {
        message: `Job "${jobName}" Scheduled Successfully`,
        status: 200,
      };
    } catch (err) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.INFO,
        functionName: 'scheduleAgendaJob',
        functionParams: [
          {
            paramName: 'jobName',
            paramValue: jobName,
            paramType: typeof jobName,
          },

          {
            paramName: 'scheduledDate',
            paramValue: scheduledDate,
            paramType: typeof scheduledDate,
          },
          {
            paramName: 'jobData',
            paramValue: jobData,
            paramType: typeof jobData,
          },
        ],
        additionalMessage: `Error Processing Agenda Job: ${err.message}`,
        startLogId,
      });
      return {
        message: err.message,
        status: 500,
      };
    }
  },
};

export const resolvers = {queries, mutations};
