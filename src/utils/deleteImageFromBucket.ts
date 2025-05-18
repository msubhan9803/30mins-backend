import AWS from 'aws-sdk';
import AwsSecrets from './getAwsSecrets';

export default async function deleteImageFromBucket(imageLink: string) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  AWS.config.update({
    region: ENV_VALUES.AWS_S3_REGION,
  });

  const S3 = new AWS.S3();

  S3.deleteObject(
    {
      Bucket: ENV_VALUES.AWS_S3_BUCKET_NAME,
      Key: imageLink,
    },
    (err, data) => {
      if (err) console.log(err);
      else console.log(data);
    }
  );
}
