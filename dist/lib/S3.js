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
import stream from 'stream';
import jwt from 'jsonwebtoken';
import cuid from 'cuid';
import User from '../MongoModels/User';
import Publication from '../MongoModels/Publication';
import Organization from '../MongoModels/Organization';
import OrganizationMembership from '../MongoModels/OrganizationMembership';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
import dayjs from 'dayjs';
import AwsSecrets from '../utils/getAwsSecrets';
import Service from '../MongoModels/Service';
export class AWSS3Uploader {
    constructor() {
        AWS.config = new AWS.Config();
        AWS.config.update({
            region: 'us-east-2',
        });
        this.s3 = new AWS.S3();
    }
    singleFileUploadResolver(parent, { file, accessToken, uploadType, documentId, }) {
        return __awaiter(this, void 0, void 0, function* () {
            let startLogId;
            // eslint-disable-next-line no-async-promise-executor
            const resolverPromise = yield new Promise((res, rej) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const SECRETS = yield AwsSecrets.getInstance();
                const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
                const decodedToken = jwt.verify(accessToken, accessTokenSecret);
                const { createReadStream, filename, mimetype, encoding } = yield file;
                const generatedFileName = `${dayjs().format('DDMMYY')}${cuid()}.${mimetype.split('/')[1]}`;
                startLogId = yield createApiLog({
                    type: ApiLogTypes.MUTATION_START,
                    level: ApiLogLevels.INFO,
                    functionName: 'singleFileUpload',
                    functionParams: [
                        { paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType },
                        { paramName: 'documentId', paramValue: documentId, paramType: typeof documentId },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        { paramName: 'filename', paramValue: filename, paramType: typeof filename },
                        { paramName: 'mimetype', paramValue: mimetype, paramType: typeof mimetype },
                        { paramName: 'encoding', paramValue: encoding, paramType: typeof encoding },
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
                readStream.pipe((yield uploadStream).writeStream);
                const result = (yield uploadStream).promise;
                // // Get the link representing the uploaded file
                const link = (yield result).Location;
                // // save it to our database
                const { UserId } = decodedToken;
                if (uploadType === 'USER_AVATAR') {
                    const user = yield User.findOne({
                        _id: UserId,
                    }).orFail(() => new Error('Document Not Found'));
                    if (user.accountDetails.avatar) {
                        const deleteResponse = this.s3.deleteObject({
                            Bucket: SECRETS.AWS_S3_BUCKET_NAME,
                            Key: user.accountDetails.avatar,
                        }, (err, data) => {
                            if (err)
                                console.log(err);
                            else
                                console.log(data);
                        });
                    }
                    user.accountDetails.avatar = link;
                    yield user.save();
                }
                if (uploadType === 'MARKETER_UPLOAD') {
                    const user = yield User.findOne({
                        _id: UserId,
                    }).orFail(() => new Error('Document Not Found'));
                    if (!(user === null || user === void 0 ? void 0 : user.isMarketer) && !(((_a = user === null || user === void 0 ? void 0 : user.accountDetails) === null || _a === void 0 ? void 0 : _a.accountType) === 'admin')) {
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
                    const user = yield User.findOne({
                        _id: UserId,
                    }).orFail(() => new Error('Document Not Found'));
                    if (user.accountDetails.profileBackground) {
                        const deleteResponse = this.s3.deleteObject({
                            Bucket: SECRETS.AWS_S3_BUCKET_NAME,
                            Key: user.accountDetails.profileBackground,
                        }, (err, data) => {
                            if (err)
                                console.log(err);
                            else
                                console.log(data);
                        });
                    }
                    user.accountDetails.profileBackground = link;
                    yield user.save();
                }
                if (uploadType === 'EDIT_PUBLICATION_IMAGE') {
                    const publication = yield Publication.findOne({
                        _id: documentId,
                        userId: decodedToken.UserId,
                    }).orFail(() => new Error('Document Not Found'));
                    if (publication.image) {
                        const deleteResponse = this.s3.deleteObject({
                            Bucket: SECRETS.AWS_S3_BUCKET_NAME,
                            Key: publication.image,
                        }, (err, data) => {
                            if (err)
                                console.log(err);
                            else
                                console.log(data);
                        });
                    }
                    publication.image = link;
                    yield publication.save();
                }
                if (uploadType === 'EDIT_SERVICE_IMAGE') {
                    const service = yield Service.findOne({
                        _id: documentId,
                        userId: decodedToken.UserId,
                    }).orFail(() => new Error('Document Not Found'));
                    if (service === null || service === void 0 ? void 0 : service.image) {
                        const deleteResponse = this.s3.deleteObject({
                            Bucket: SECRETS.AWS_S3_BUCKET_NAME,
                            Key: service.image,
                        }, (err, data) => {
                            if (err)
                                console.log(err);
                            else
                                console.log(data);
                        });
                    }
                    service.image = link;
                    yield service.save();
                }
                if (uploadType === 'EDIT_ORGANIZATION_IMAGE') {
                    const isOwner = yield OrganizationMembership.exists({
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
                    const organization = yield Organization.findById(documentId);
                    if (organization.image) {
                        const deleteResponse = this.s3.deleteObject({
                            Bucket: SECRETS.AWS_S3_BUCKET_NAME,
                            Key: organization.image,
                        }, (err, data) => {
                            if (err)
                                console.log(err);
                            else
                                console.log(data);
                        });
                    }
                    organization.image = link;
                    yield organization.save();
                }
                res({
                    message: link,
                    status: 200,
                });
            }))
                .then((data) => __awaiter(this, void 0, void 0, function* () {
                const SECRETS = yield AwsSecrets.getInstance();
                const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
                const decodedToken = jwt.verify(accessToken, accessTokenSecret);
                const { filename, mimetype, encoding } = yield file;
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'singleFileUpload',
                    functionParams: [
                        { paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType },
                        { paramName: 'documentId', paramValue: documentId, paramType: typeof documentId },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        { paramName: 'filename', paramValue: filename, paramType: typeof filename },
                        { paramName: 'mimetype', paramValue: mimetype, paramType: typeof mimetype },
                        { paramName: 'encoding', paramValue: encoding, paramType: typeof encoding },
                    ],
                    additionalMessage: 'Upload Successful',
                    startLogId,
                });
                return {
                    message: data.message,
                    status: data.status,
                };
            }))
                .catch((err) => __awaiter(this, void 0, void 0, function* () {
                const SECRETS = yield AwsSecrets.getInstance();
                if (err.name === 'JsonWebTokenError') {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'singleFileUpload',
                        functionParams: [
                            { paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType },
                            { paramName: 'documentId', paramValue: documentId, paramType: typeof documentId },
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
                const decodedToken = jwt.verify(accessToken, accessTokenSecret);
                const { filename, mimetype, encoding } = yield file;
                if (err.name === 'PayloadTooLargeError') {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'singleFileUpload',
                        functionParams: [
                            { paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType },
                            { paramName: 'documentId', paramValue: documentId, paramType: typeof documentId },
                            {
                                paramName: 'userId',
                                paramValue: decodedToken.UserId,
                                paramType: typeof decodedToken.UserId,
                            },
                            { paramName: 'filename', paramValue: filename, paramType: typeof filename },
                            { paramName: 'mimetype', paramValue: mimetype, paramType: typeof mimetype },
                            { paramName: 'encoding', paramValue: encoding, paramType: typeof encoding },
                        ],
                        additionalMessage: 'File Size Exceeds Limit',
                        startLogId,
                    });
                    return {
                        message: 'File Size Exceeds Limit',
                        status: 400,
                    };
                }
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'singleFileUpload',
                    functionParams: [
                        { paramName: 'uploadType', paramValue: uploadType, paramType: typeof uploadType },
                        { paramName: 'documentId', paramValue: documentId, paramType: typeof documentId },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        { paramName: 'filename', paramValue: filename, paramType: typeof filename },
                        { paramName: 'mimetype', paramValue: mimetype, paramType: typeof mimetype },
                        { paramName: 'encoding', paramValue: encoding, paramType: typeof encoding },
                    ],
                    additionalMessage: err.message,
                    startLogId,
                });
                return {
                    message: 'Unknown Error',
                    status: 500,
                };
            }));
            return {
                message: resolverPromise.message,
                status: resolverPromise.status,
            };
        });
    }
    createUploadStream(key, isProductFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const pass = new stream.PassThrough();
            const SECRETS = yield AwsSecrets.getInstance();
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
        });
    }
}
//# sourceMappingURL=S3.js.map