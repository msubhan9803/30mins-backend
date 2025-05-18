import getEducationHistoryById from './queries/getEducationHistoryById';
import getEducationHistoryByUserId from './queries/getEducationHistoryByUserId';
import createEducationHistory from './mutations/createEducationHistory';
import editEducationHistory from './mutations/editEducationHistory';
import deleteEducationHistory from './mutations/deleteEducationHistory';
const queries = { getEducationHistoryById, getEducationHistoryByUserId };
const mutations = { createEducationHistory, editEducationHistory, deleteEducationHistory };
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map