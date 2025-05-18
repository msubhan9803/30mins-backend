import getAllGroups from './queries/getAllGroups';
import getCollectiveAvailability from './queries/getCollectiveAvailability';
import getGroupById from './queries/getGroupByID';
import createGroup from './mutations/createGroup';
import editGroup from './mutations/editGroup';
import deleteGroup from './mutations/deleteGroup';
const queries = { getGroupById, getAllGroups, getCollectiveAvailability };
const mutations = { createGroup, editGroup, deleteGroup };
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map