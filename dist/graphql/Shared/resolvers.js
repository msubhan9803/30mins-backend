var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AWSS3Uploader } from '../../lib/S3';
import deleteImageForUser from './deleteImageForUser';
import AwsSecrets from '../../utils/getAwsSecrets';
const s3Uploader = new AWSS3Uploader();
const queries = {
    getENV: (parent, args, context, info) => __awaiter(void 0, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        return SECRETS.Test;
    }),
};
const mutations = {
    singleUpload: s3Uploader.singleFileUploadResolver.bind(s3Uploader),
    deleteImageForUser: deleteImageForUser,
};
export const resolvers = { queries, mutations };
//# sourceMappingURL=resolvers.js.map