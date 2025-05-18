import getMutualAuthList from './queries/getMutualAuthList';
import updateMutualAuths from './mutations/updateMutualAuths';

const queries = {getMutualAuthList};

const mutations = {
  updateMutualAuths,
};

export const resolvers = {queries, mutations};
