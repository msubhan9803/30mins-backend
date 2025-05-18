import getServiceById from './queries/getServiceById';
import getServicesByUserId from './queries/getServicesByUserId';
import getServicesForAdmin from './queries/getServicesForAdmin';
import getServicesForBackend from './queries/getServicesForBackend';
import getServicesForSeo from './queries/getServicesForSeo';
import getServiceCount from "./queries/getServicesCount";
import createService from './mutations/createService';
import createOrganizationService from './mutations/createOrganizationService';
import editService from './mutations/editService';
import editOrganizationService from './mutations/editOrganizationService';
import backendEditService from './mutations/backendEditService';
import deleteService from './mutations/deleteService';
import deleteOrganizationService from './mutations/deleteOrganizationService';
import createOrgRoundRobinService from './mutations/createOrgRoundRobinService';
import assignRoundRobinTeamToService from './mutations/assignRoundRobinTeamToService';
import removeRoundRobinTeamFromService from './mutations/removeRoundRobinTeamFromService';
import editOrgRoundRobinService from './mutations/editOrgRoundRobinService';
import deleteOrgRoundRobinService from './mutations/deleteOrgRoundRobinService';
import getOrgRoundRobinService from './queries/getOrgRoundRobinService';
import getOrgRoundRobinServices from './queries/getOrgRoundRobinServices';
import getServiceCountWithRRId from './queries/getServiceCountWithRRId';
import getServiceSlug from './queries/getServiceSlug';
import getServiceCharity from './queries/getServiceCharity';
const queries = {
    getServiceById,
    getServicesByUserId,
    getServicesForAdmin,
    getServicesForSeo,
    getServicesForBackend,
    getOrgRoundRobinServices,
    getOrgRoundRobinService,
    getServiceCountWithRRId,
    getServiceSlug,
    getServiceCharity,
    getServiceCount
};
const mutations = {
    createService,
    createOrganizationService,
    editService,
    editOrganizationService,
    deleteService,
    deleteOrganizationService,
    backendEditService,
    createOrgRoundRobinService,
    assignRoundRobinTeamToService,
    removeRoundRobinTeamFromService,
    editOrgRoundRobinService,
    deleteOrgRoundRobinService,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map