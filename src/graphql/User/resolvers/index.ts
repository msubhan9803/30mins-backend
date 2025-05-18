import getPublicUserData from './queries/getPublicUserData';
import getUserById from './queries/getUserById';
import getUserByUsername from './queries/getUserByUsername';
import getUserSearchResults from './queries/getUserSearchResults';
import getUsersForAdmin from './queries/getUsersForAdmin';
import getUserForAdmin from './queries/getUserForAdmin';
import getUsersCount from './queries/getUserCount';
import getUserByCode from './queries/getUserByCode';
import getSentJoinInvites from './queries/getSentJoinInvites';
import getlastWarningSent from './queries/getlastWarningSent';
import getUsersWithAdvertisingExtension from './queries/getUsersWithAdvertisingExtension';
import getUserAndOrganizationSearchResults from './queries/getUserAndOrganizationSearchResults';
import checkUserEmailAndCalendar from './queries/checkUserEmailAndCalendar';
import getUsersForSeo from './queries/getUsersForSeo';
import getUserForStartConversation from './queries/getUserForStartConversation';
import getLastSeenOfUser from './queries/getLastSeenOfUser';
import getResultsForMarketer from './queries/getResultsForMarketer';
import checkVerifiedStatus from './queries/checkVerifiedStatus';
import getUserDashboardData from './queries/getUserDashboardData';

import handleSignIn from './mutations/handleSignIn';
import handleOtpSignUp from './mutations/handleOtpSignUp';
import handleOtpSignIn from './mutations/handleOtpSignIn';
import handleSMSSignIn from './mutations/handleSMSSignIn';
import handleSMSSignUp from './mutations/handleSMSSignUp';
import validateOtp from './mutations/validateOtp';
import updateUserWelcome from './mutations/updateUserWelcome';
import updateUser from './mutations/updateUser';
import makeAffiliateUser from './mutations/makeAffiliateUser';
import adminUpdateUser from './mutations/adminUpdateUser';
import updateWorkingHours from './mutations/updateWorkingHours';
import deleteUser from './mutations/deleteUser';
import adminDeleteUser from './mutations/adminDeleteUser';
import generateInviteLink from './mutations/generateInviteLink';
import handleEmailChange from './mutations/handleEmailChange';
import adminDeleteUsers from './mutations/adminDeleteUsers';
import backendUpdateUser from './mutations/backendUpdateUser';
import updateLastSeen from './mutations/updateLastSeen';
import marketerCreateUser from './mutations/marketerCreateUser';
import marketerDeleteUser from './mutations/marketerDeleteUser';
import makeUserVerified from './mutations/makeUserVerified';
import resetWelcomeProcess from './mutations/resetWelcomeProcess';
import sendSmsOtp from './mutations/sendSmsOtp';
import validateSmsOtp from './mutations/validateSmsOtp';
import getPaymentOptionsData from './queries/getPaymentOptionsData';
import updatePaymentMethods from './mutations/updatePaymentMethods';

const queries = {
  getUserById,
  getUserByUsername,
  getPublicUserData,
  getUserSearchResults,
  getUsersForAdmin,
  getUserForAdmin,
  getUserByCode,
  getSentJoinInvites,
  getlastWarningSent,
  getUsersWithAdvertisingExtension,
  getUserAndOrganizationSearchResults,
  checkUserEmailAndCalendar,
  getUsersForSeo,
  getUserForStartConversation,
  getLastSeenOfUser,
  getResultsForMarketer,
  checkVerifiedStatus,
  getUsersCount,
  getUserDashboardData,
  getPaymentOptionsData,
};

const mutations = {
  handleSignIn,
  handleOtpSignUp,
  handleOtpSignIn,
  handleSMSSignIn,
  handleSMSSignUp,
  validateOtp,
  updateUserWelcome,
  updateUser,
  adminUpdateUser,
  updateWorkingHours,
  deleteUser,
  adminDeleteUser,
  generateInviteLink,
  handleEmailChange,
  adminDeleteUsers,
  backendUpdateUser,
  updateLastSeen,
  marketerCreateUser,
  marketerDeleteUser,
  makeAffiliateUser,
  makeUserVerified,
  resetWelcomeProcess,
  sendSmsOtp,
  validateSmsOtp,
  updatePaymentMethods,
};

export const resolvers = {queries, mutations};
