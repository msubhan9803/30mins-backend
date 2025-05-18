import getJobHistoryById from './queries/getJobHistoryById';
import getJobHistoryByUserId from './queries/getJobHistoryByUserId';

import createJobHistory from './mutations/createJobHistory';
import editJobHistory from './mutations/editJobHistory';
import deleteJobHistory from './mutations/deleteJobHistory';

const queries = {getJobHistoryById, getJobHistoryByUserId};

const mutations = {createJobHistory, editJobHistory, deleteJobHistory};

export const resolvers = {queries, mutations};
