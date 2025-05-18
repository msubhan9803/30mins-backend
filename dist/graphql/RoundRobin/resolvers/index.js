import createRoundRobinTeam from './mutations/createRoundRobinTeam';
import editRoundRobinTeam from './mutations/editRoundRobinTeam';
import deleteRoundRobinTeam from './mutations/deleteRoundRobinTeam';
import getRoundRobinTeamByTeamId from './queries/getRoundRobinTeamByTeamId';
import getRoundRobinTeamsByOrganizationId from './queries/getRoundRobinTeamsByOrganizationId';
const queries = { getRoundRobinTeamByTeamId, getRoundRobinTeamsByOrganizationId };
const mutations = { createRoundRobinTeam, deleteRoundRobinTeam, editRoundRobinTeam };
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map