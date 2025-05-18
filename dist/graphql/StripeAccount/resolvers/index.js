import getStripeAccount from './queries/getStripeAccount';
import createStripeAccount from './mutations/createStripeAccount';
import updateStripeAccount from './mutations/updateStripeAccount';
import deleteStripeAccount from './mutations/deleteStripeAccount';
const queries = { getStripeAccount };
const mutations = {
    createStripeAccount,
    updateStripeAccount,
    deleteStripeAccount,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map