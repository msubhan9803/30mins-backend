import AWS from 'aws-sdk';
import stream from 'stream';
import {AccessToken, File, IUploader, Response} from '../constants/types';
import jwt from 'jsonwebtoken';
import cuid from 'cuid';
import User from '../MongoModels/User';
import Publication from '../MongoModels/Publication';
import Organization from '../MongoModels/Organization';
import OrganizationMembership from '../MongoModels/OrganizationMembership';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';
import dayjs from 'dayjs';
import AwsSecrets from '../utils/getAwsSecrets';
import Service from '../MongoModels/Service';

type S3UploadStream = {
  writeStream: stream.PassThrough;
  promise: Promise<AWS.S3.ManagedUpload.SendData>;
};

export class AWSS3Uploader implements IUploader {
  private s3: AWS.S3;

  constructor() {
    AWS.config = new AWS.Config();
    AWS.config.update({
      region: 'us-east-2',
    });

    this.s3 = new AWS.S3();
  }

  async singleFileUploadResolver(
    parent,
    {
      file,
      accessToken,
      uploadType,
      documentId,
    }: {file: Promise<File>; accessToken: string; uploadType: string; documentId: string}
  ): Promise<Response> {
    let startLogId: String;
    // eslint-disable-next-line no-async-promise-executor
    const resolverPromise: Response = await new Promise<Response>(async (res, rej) => {
      const SECRETS = await AwsSecrets.getInstance();
      const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
      const decodedToken = jwt.verify(accessToken, accessTokenSecret) as unknown as AccessToken;

      const {createReadStream, filename, mimetype, encoding} = await file;

      const generatedFileName = `${dayjs().format('DDMMYY')}${cuid()}.${mimetype.split('/')[1]}`;

      startLogId = await createApiLog({
        type: ApiLogTypes.MUTATION_START,
        level: ApiLogLevels.INFO,
        functionName: 'singleFileUpload',
        functionParams: [
          {paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType},
          {paramName: 'documentId', paramValue: documentId, paramType: typeof documentId},
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {paramName: 'filename', paramValue: filename, paramType: typeof filename},
          {paramName: 'mimetype', paramValue: mimetype, paramType: typeof mimetype},
          {paramName: 'encoding', paramValue: encoding, paramType: typeof encoding},
        ],
      });

      const isProductFile = uploadType === 'PRODUCT_FILE';
      // Create an upload stream that goes to S3
      const uploadStream = this.createUploadStream(generatedFileName, isProductFile);

      // Pipe the file data into the upload stream
      const readStream = createReadStream();
      readStream.on('error', err => {
        rej(err);
      });

      readStream.pipe((await uploadStream).writeStream);

      const result = (await uploadStream).promise;

      // // Get the link representing the uploaded file
      const link = (await result).Location;
      // // save it to our database
      const {UserId} = decodedToken;

      if (uploadType === 'USER_AVATAR') {
        const user = await User.findOne({
          _id: UserId,
        }).orFail(() => new Error('Document Not Found'));

        if (user.accountDetails.avatar) {
          const deleteResponse = this.s3.deleteObject(
            {
              Bucket: SECRETS.AWS_S3_BUCKET_NAME,
              Key: user.accountDetails.avatar,
            },
            (err, data) => {
              if (err) console.log(err);
              else console.log(data);
            }
          );
        }

        user.accountDetails.avatar = link;
        await user.save();
      }

      if (uploadType === 'MARKETER_UPLOAD') {
        const user = await User.findOne({
          _id: UserId,
        }).orFail(() => new Error('Document Not Found'));

        if (!user?.isMarketer && !(user?.accountDetails?.accountType === 'admin')) {
          res({
            message: 'Not Authenticated',
            status: 401,
          });
        }

        res({
          message: link,
          status: 200,
        });
      }

      if (uploadType === 'PROFILE_BACKGROUND') {
        const user = await User.findOne({
          _id: UserId,
        }).orFail(() => new Error('Document Not Found'));

        if (user.accountDetails.profileBackground) {
          const deleteResponse = this.s3.deleteObject(
            {
              Bucket: SECRETS.AWS_S3_BUCKET_NAME,
              Key: user.accountDetails.profileBackground,
            },
            (err, data) => {
              if (err) console.log(err);
              else console.log(data);
            }
          );
        }

        user.accountDetails.profileBackground = link;
        await user.save();
      }

      if (uploadType === 'EDIT_PUBLICATION_IMAGE') {
        const publication = await Publication.findOne({
          _id: documentId,
          userId: decodedToken.UserId,
        }).orFail(() => new Error('Document Not Found'));

        if (publication.image) {
          const deleteResponse = this.s3.deleteObject(
            {
              Bucket: SECRETS.AWS_S3_BUCKET_NAME,
              Key: publication.image,
            },
            (err, data) => {
              if (err) console.log(err);
              else console.log(data);
            }
          );
        }

        publication.image = link;
        await publication.save();
      }

      if (uploadType === 'EDIT_SERVICE_IMAGE') {
        const service = await Service.findOne({
          _id: documentId,
          userId: decodedToken.UserId,
        }).orFail(() => new Error('Document Not Found'));

        if (service?.image) {
          const deleteResponse = this.s3.deleteObject(
            {
              Bucket: SECRETS.AWS_S3_BUCKET_NAME,
              Key: service.image,
            },
            (err, data) => {
              if (err) console.log(err);
              else console.log(data);
            }
          );
        }

        service.image = link;
        await service.save();
      }

      if (uploadType === 'EDIT_ORGANIZATION_IMAGE') {
        const isOwner = await OrganizationMembership.exists({
          userId: decodedToken.UserId,
          organizationId: documentId,
          role: 'owner',
        });

        if (!isOwner) {
          res({
            message: 'Not Authenticated',
            status: 401,
          });
        }

        const organization = await Organization.findById(documentId);

        if (organization.image) {
          const deleteResponse = this.s3.deleteObject(
            {
              Bucket: SECRETS.AWS_S3_BUCKET_NAME,
              Key: organization.image,
            },
            (err, data) => {
              if (err) console.log(err);
              else console.log(data);
            }
          );
        }

        organization.image = link;
        await organization.save();
      }

      res({
        message: link,
        status: 200,
      });
    })
      .then(async data => {
        const SECRETS = await AwsSecrets.getInstance();

        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(accessToken, accessTokenSecret) as unknown as AccessToken;
        const {filename, mimetype, encoding} = await file;

        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.INFO,
          functionName: 'singleFileUpload',
          functionParams: [
            {paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType},
            {paramName: 'documentId', paramValue: documentId, paramType: typeof documentId},
            {
              paramName: 'userId',
              paramValue: decodedToken.UserId,
              paramType: typeof decodedToken.UserId,
            },
            {paramName: 'filename', paramValue: filename, paramType: typeof filename},
            {paramName: 'mimetype', paramValue: mimetype, paramType: typeof mimetype},
            {paramName: 'encoding', paramValue: encoding, paramType: typeof encoding},
          ],
          additionalMessage: 'Upload Successful',
          startLogId,
        });

        return {
          message: data.message,
          status: data.status,
        };
      })
      .catch(async err => {
        const SECRETS = await AwsSecrets.getInstance();
        if (err.name === 'JsonWebTokenError') {
          await createApiLog({
            type: ApiLogTypes.MUTATION_END,
            level: ApiLogLevels.ERROR,
            functionName: 'singleFileUpload',
            functionParams: [
              {paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType},
              {paramName: 'documentId', paramValue: documentId, paramType: typeof documentId},
            ],
            additionalMessage: 'Invalid Permissions: Invalid JWT Token',
            startLogId,
          });

          return {
            message: 'Not Authenticated',
            status: 401,
          };
        }

        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(accessToken, accessTokenSecret) as unknown as AccessToken;
        const {filename, mimetype, encoding} = await file;

        if (err.name === 'PayloadTooLargeError') {
          await createApiLog({
            type: ApiLogTypes.MUTATION_END,
            level: ApiLogLevels.ERROR,
            functionName: 'singleFileUpload',
            functionParams: [
              {paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType},
              {paramName: 'documentId', paramValue: documentId, paramType: typeof documentId},
              {
                paramName: 'userId',
                paramValue: decodedToken.UserId,
                paramType: typeof decodedToken.UserId,
              },
              {paramName: 'filename', paramValue: filename, paramType: typeof filename},
              {paramName: 'mimetype', paramValue: mimetype, paramType: typeof mimetype},
              {paramName: 'encoding', paramValue: encoding, paramType: typeof encoding},
            ],
            additionalMessage: 'File Size Exceeds Limit',
            startLogId,
          });

          return {
            message: 'File Size Exceeds Limit',
            status: 400,
          };
        }

        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'singleFileUpload',
          functionParams: [
            {paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType},
            {paramName: 'documentId', paramValue: documentId, paramType: typeof documentId},
            {
              paramName: 'userId',
              paramValue: decodedToken.UserId,
              paramType: typeof decodedToken.UserId,
            },
            {paramName: 'filename', paramValue: filename, paramType: typeof filename},
            {paramName: 'mimetype', paramValue: mimetype, paramType: typeof mimetype},
            {paramName: 'encoding', paramValue: encoding, paramType: typeof encoding},
          ],
          additionalMessage: err.message,
          startLogId,
        });

        return {
          message: 'Unknown Error',
          status: 500,
        };
      });

    return {
      message: resolverPromise.message,
      status: resolverPromise.status,
    };
  }

  private async createUploadStream(key: string, isProductFile: boolean): Promise<S3UploadStream> {
    const pass = new stream.PassThrough();
    const SECRETS = await AwsSecrets.getInstance();
    return {
      writeStream: pass,
      promise: this.s3
        .upload({
          Bucket: isProductFile ? SECRETS.AWS_S3_ASSETS : SECRETS.AWS_S3_BUCKET_NAME,
          Key: key,
          Body: pass,
        })
        .promise(),
    };
  }
}
