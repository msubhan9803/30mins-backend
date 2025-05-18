import getActiveExtensions from './queries/getActiveExtensions';
import getActiveExtensionsForAdmin from './queries/getActiveExtensionsForAdmin';
import getActiveExtensionById from './queries/getActiveExtensionById';
import getActiveExtensionByProductId from './queries/getActiveExtensionByProductId';
import getExtensionsCounts from './queries/getExtensionsCount';

import createActiveExtension from './mutations/createActiveExtension';
import updateActiveExtension from './mutations/updateActiveExtension';
import deleteActiveExtension from './mutations/deleteActiveExtension';
import addGiftedExtension from './mutations/addGiftedExtension';
import adminAddGiftedExtension from './mutations/adminAddGiftedExtension';
import removeGiftedExtension from './mutations/removeGiftedExtension';
import adminDeleteActiveExtension from './mutations/adminDeleteActiveExtension';
import checkExtensionStatus from './queries/checkExtensionStatus';
const queries = {
  getActiveExtensions,
  getActiveExtensionById,
  getActiveExtensionByProductId,
  getActiveExtensionsForAdmin,
  checkExtensionStatus,
  getExtensionsCounts
};
const mutations = {
  createActiveExtension,
  updateActiveExtension,
  deleteActiveExtension,
  addGiftedExtension,
  removeGiftedExtension,
  adminAddGiftedExtension,
  adminDeleteActiveExtension,
};

export const resolvers = {queries, mutations};
