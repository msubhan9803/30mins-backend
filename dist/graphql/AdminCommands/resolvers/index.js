import deleteUsersByCriteria from './mutations/deleteUsersByCriteria';
import getUsersByCriteria from './queries/getUsersByCriteria';
const queries = {
    getUsersByCriteria,
};
const mutations = {
    deleteUsersByCriteria,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map