import getPublicationById from './queries/getPublicationById';
import getPublicationsByUserId from './queries/getPublicationsByUserId';
import createPublication from './mutations/createPublication';
import editPublication from './mutations/editPublication';
import deletePublication from './mutations/deletePublication';
const queries = { getPublicationById, getPublicationsByUserId };
const mutations = { createPublication, editPublication, deletePublication };
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map