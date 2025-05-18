import {AWSS3Uploader} from '../../lib/S3';
import deleteImageForUser from './deleteImageForUser';
import AwsSecrets from '../../utils/getAwsSecrets';

const s3Uploader = new AWSS3Uploader();

const queries = {
  getENV: async (parent, args, context, info) => {
    const SECRETS = await AwsSecrets.getInstance();
    return SECRETS.Test;
  },
};

const mutations = {
  singleUpload: s3Uploader.singleFileUploadResolver.bind(s3Uploader),
  deleteImageForUser: deleteImageForUser,
};

export const resolvers = {queries, mutations};
