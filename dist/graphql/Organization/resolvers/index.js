import getOrganizationManagementDetails from './queries/getOrganizationManagementDetails';
import getOrganizationMemberResults from './queries/getOrganizationMemberResults';
import getOrganizationMembersById from './queries/getOrganizationMembersById';
import getOrganizationsByTitle from './queries/getOrganizationsByTitle';
import getOrganizationBySlug from './queries/getOrganizationBySlug';
import getOrganizationById from './queries/getOrganizationById';
import getOrganizationsByUserId from './queries/getOrganizationsByUserId';
import getOrganizationServiceResults from './queries/getOrganizationServiceResults';
import getPendingInvitesByUserId from './queries/getPendingInvitesByUserId';
import getPendingJoinRequestsByUserId from './queries/getPendingJoinRequestsByUserId';
import getPendingJoinRequestsByOrgId from './queries/getPendingJoinRequestsByOrgId';
import getPendingInvitesByOrgId from './queries/getPendingInvitesByOrgId';
import getOrganizationMembership from './queries/getOrganizationMembership';
import getOrganizationSearchResults from './queries/getOrganizationSearchResults';
import getOrganizationsForAdmin from './queries/getOrganizationsForAdmin';
import getOrganizationsForSeo from './queries/getOrganizationsForSeo';
import getOrganizationCounts from "./queries/getOrganizationCounts";
import getReferralUsersByOrganizationId from "./queries/getReferralUsersByOrganizationId";
import adminEditOrganization from './mutations/adminEditOrgination';
import createOrganization from './mutations/createOrganization';
import editOrganization from './mutations/editOrganization';
import deleteOrganization from './mutations/deleteOrganization';
import addOrganizationMember from './mutations/addOrganizationMember';
import editOrganizationMemberRole from './mutations/editOrganizationMemberRole';
import kickOrganizationMember from './mutations/kickOrganizationMember';
import leaveOrganization from './mutations/leaveOrganization';
import addOrganizationServiceCategory from './mutations/addOrganizationServiceCategory';
import removeOrganizationServiceCategory from './mutations/removeOrganizationServiceCategory';
import createPendingInvite from './mutations/createPendingInvite';
import deletePendingInvite from './mutations/deletePendingInvite';
import acceptPendingInvite from './mutations/acceptPendingInvite';
import declinePendingInvite from './mutations/declinePendingInvite';
import createPendingJoinRequest from './mutations/createPendingJoinRequest';
import acceptPendingJoinRequest from './mutations/acceptPendingJoinRequest';
import declinePendingJoinRequest from './mutations/declinePendingJoinRequest';
import linkUserToOrganization from './mutations/linkUserToOrganization';
import adminDeleteOrganization from './mutations/adminDeleteOrganization';
import adminCreateOrganization from './mutations/adminCreateOrganization';
import marketerCreateOrganization from './mutations/marketerCreateOrganization';
import marketerDeleteOrganization from './mutations/marketerDeleteOrganization';
const queries = {
    getOrganizationsByTitle,
    getOrganizationBySlug,
    getOrganizationById,
    getOrganizationsByUserId,
    getOrganizationServiceResults,
    getOrganizationMemberResults,
    getOrganizationManagementDetails,
    getOrganizationMembersById,
    getPendingInvitesByUserId,
    getPendingJoinRequestsByOrgId,
    getPendingInvitesByOrgId,
    getOrganizationMembership,
    getOrganizationSearchResults,
    getOrganizationsForAdmin,
    getOrganizationsForSeo,
    getPendingJoinRequestsByUserId,
    getOrganizationCounts,
    getReferralUsersByOrganizationId,
};
const mutations = {
    createOrganization,
    editOrganization,
    deleteOrganization,
    addOrganizationMember,
    editOrganizationMemberRole,
    kickOrganizationMember,
    leaveOrganization,
    addOrganizationServiceCategory,
    removeOrganizationServiceCategory,
    createPendingInvite,
    deletePendingInvite,
    acceptPendingInvite,
    declinePendingInvite,
    createPendingJoinRequest,
    acceptPendingJoinRequest,
    declinePendingJoinRequest,
    linkUserToOrganization,
    adminDeleteOrganization,
    adminCreateOrganization,
    adminEditOrganization,
    marketerCreateOrganization,
    marketerDeleteOrganization,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=index.js.map