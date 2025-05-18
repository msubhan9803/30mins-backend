import getCharities from './queries/getCharities';
import getPublicCharities from './queries/getPublicCharities';
import getCharityById from './queries/getCharityById';
import getPublicCharityById from './queries/getPublicCharityById';
import createCharity from './mutations/createCharity';
import updateCharity from './mutations/updateCharity';
import deleteCharity from './mutations/deleteCharity';
const queries = { getCharities, getCharityById, getPublicCharities, getPublicCharityById };
const mutations = { createCharity, updateCharity, deleteCharity };
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map