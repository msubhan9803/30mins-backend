import getPostById from './queries/getPostById';
import getPostsByUserId from './queries/getPostsByUserId';
import getPostsByUserToken from './queries/getPostsByUserToken';
import createPost from './mutations/createPost';
import editPost from './mutations/editPost';
import deletePost from './mutations/deletePost';

const queries = {
  getPostById,
  getPostsByUserId,
  getPostsByUserToken,
};

const mutations = {
  createPost,
  editPost,
  deletePost,
};

export const resolvers = {queries, mutations};
