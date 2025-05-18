var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Post from '../../../../MongoModels/Post';
import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function createPost(parent, { postData, token }) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createPost',
                functionParams: [
                    {
                        paramName: 'createPost',
                        paramValue: postData,
                        paramType: typeof postData,
                    },
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
            const { title, image, description, tags } = postData;
            const createdPost = yield Post.create({
                userId: decodedToken.UserId,
                title,
                image,
                description,
                tags,
            });
            const updatedUser = yield User.findByIdAndUpdate(decodedToken.UserId, {
                $push: {
                    posts: createdPost._id,
                },
            })
                .orFail(() => new Error('User Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createService',
                functionParams: [
                    {
                        paramName: 'postData',
                        paramValue: postData,
                        paramType: typeof postData,
                    },
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
                additionalMessage: 'Post Created Successfully',
                startLogId,
            });
            return {
                message: 'Post Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createService',
                    functionParams: [
                        {
                            paramName: 'postData',
                            paramValue: postData,
                            paramType: typeof postData,
                        },
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
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Post validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createService',
                    functionParams: [
                        {
                            paramName: 'postData',
                            paramValue: postData,
                            paramType: typeof postData,
                        },
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
                    additionalMessage: 'Mongoose Post Validation Failed',
                    startLogId,
                });
                return {
                    message: err.message,
                    status: 400,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'createService',
                functionParams: [
                    {
                        paramName: 'postData',
                        paramValue: postData,
                        paramType: typeof postData,
                    },
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
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=createPost.js.map