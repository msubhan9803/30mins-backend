var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import AWS from 'aws-sdk';
import AwsSecrets from './getAwsSecrets';
export default function deleteImageFromBucket(imageLink) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        AWS.config.update({
            region: ENV_VALUES.AWS_S3_REGION,
        });
        const S3 = new AWS.S3();
        S3.deleteObject({
            Bucket: ENV_VALUES.AWS_S3_BUCKET_NAME,
            Key: imageLink,
        }, (err, data) => {
            if (err)
                console.log(err);
            else
                console.log(data);
        });
    });
}
//# sourceMappingURL=deleteImageFromBucket.js.map