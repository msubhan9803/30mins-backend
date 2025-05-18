var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import agenda from '../../lib/agenda';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../utils/createApiLog';
import AwsSecrets from '../../utils/getAwsSecrets';
const queries = {};
const mutations = {
    scheduleAgendaJob: (parent, { agendaJobData }, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        let startLogId;
        const { jobName, scheduledDate, jobData } = agendaJobData;
        try {
            const { token } = context;
            const SECRETS = yield AwsSecrets.getInstance();
            if (token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
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
            startLogId = yield createApiLog({
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
            const agendaInstance = yield agenda.getInstance();
            yield agendaInstance.schedule(scheduledDate, jobName, jobData);
            yield createApiLog({
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
        }
        catch (err) {
            yield createApiLog({
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
    }),
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=resolvers.js.map