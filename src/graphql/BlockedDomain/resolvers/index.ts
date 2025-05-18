import validateDomain from './queries/validateDomain';

import addBlockedDomain from './mutations/addBlockedDomain';
import deleteBlockedDomain from './mutations/deleteBlockedDomain';

const queries = {validateDomain};
const mutations = {
  addBlockedDomain,
  deleteBlockedDomain,
};

export const resolvers = {queries, mutations};
