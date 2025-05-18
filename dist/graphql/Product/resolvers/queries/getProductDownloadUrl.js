var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Product from '../../../../MongoModels/Product';
import _ from 'lodash';
import AWS from 'aws-sdk';
export default function getProductDownloadUrl(parent, { token, productId }) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getProductDownloadUrl',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const product = yield Product.findByIdAndUpdate(productId, { $inc: { totalFileDownloads: 1 } });
            if (!product) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getProductDownloadUrl',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Product not found!',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Product not found!',
                        status: 404,
                    },
                };
            }
            AWS.config = new AWS.Config();
            AWS.config.update({
                region: 'us-east-2',
                signatureVersion: 'v4',
                s3: {
                    signatureVersion: 'v4',
                },
            });
            const s3 = new AWS.S3();
            const url = yield s3.getSignedUrlPromise('getObject', {
                Bucket: ENV_VALUES.AWS_S3_ASSETS,
                Key: _.last((_a = product === null || product === void 0 ? void 0 : product.file) === null || _a === void 0 ? void 0 : _a.link.split('/')),
                Expires: 60,
            });
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getProductDownloadUrl',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'url',
                        paramValue: url,
                        paramType: typeof url,
                    },
                    {
                        paramName: 'productFileLink',
                        paramValue: _ === null || _ === void 0 ? void 0 : _.last((_c = (_b = product === null || product === void 0 ? void 0 : product.file) === null || _b === void 0 ? void 0 : _b.link) === null || _c === void 0 ? void 0 : _c.split('/')),
                        paramType: typeof (_ === null || _ === void 0 ? void 0 : _.last((_e = (_d = product === null || product === void 0 ? void 0 : product.file) === null || _d === void 0 ? void 0 : _d.link) === null || _e === void 0 ? void 0 : _e.split('/'))),
                    },
                ],
                additionalMessage: 'Download Request Successful',
                startLogId,
            });
            return {
                downloadUrl: url,
                response: {
                    message: 'Download Request Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getProductDownloadUrl',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getProductDownloadUrl',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getProductDownloadUrl.js.map