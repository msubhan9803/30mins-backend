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
import { IMAGE_TYPE } from '../../constants/enums';
import Organization from '../../MongoModels/Organization';
import OrganizationMembership from '../../MongoModels/OrganizationMembership';
import Publication from '../../MongoModels/Publication';
import Service from '../../MongoModels/Service';
import User from '../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../utils/createApiLog';
import deleteImageFromBucket from '../../utils/deleteImageFromBucket';
import AwsSecrets from '../../utils/getAwsSecrets';
export default function deleteImageForUser(parent, { imageUrl, imageType, documentId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const { token } = context;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'deleteImageForUser',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'imageUrl',
                        paramValue: imageUrl,
                        paramType: typeof imageUrl,
                    },
                    {
                        paramName: 'imageType',
                        paramValue: imageType,
                        paramType: typeof imageType,
                    },
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                ],
            });
            switch (imageType) {
                case IMAGE_TYPE.AVATAR:
                    const isOwnerOfImage = yield User.exists({
                        _id: decodedToken.UserId,
                        'accountDetails.avatar': imageUrl,
                    });
                    if (!isOwnerOfImage) {
                        yield createApiLog({
                            type: ApiLogTypes.MUTATION_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'deleteImageForUser',
                            functionParams: [
                                {
                                    paramName: 'userId',
                                    paramValue: decodedToken.UserId,
                                    paramType: typeof decodedToken.UserId,
                                },
                                {
                                    paramName: 'imageUrl',
                                    paramValue: imageUrl,
                                    paramType: typeof imageUrl,
                                },
                                {
                                    paramName: 'imageType',
                                    paramValue: imageType,
                                    paramType: typeof imageType,
                                },
                                {
                                    paramName: 'documentId',
                                    paramValue: documentId,
                                    paramType: typeof documentId,
                                },
                            ],
                            additionalMessage: 'Not Authorized: User Lacks Image Delete Permissions',
                            startLogId,
                        });
                        return {
                            message: 'Not Authorized',
                            status: 401,
                        };
                    }
                    break;
                case IMAGE_TYPE.ORGANIZATION:
                    const hasEditPermission = yield OrganizationMembership.exists({
                        userId: decodedToken.UserId,
                        organizationId: documentId,
                        role: { $in: ['owner', 'admin'] },
                    });
                    const orgOwnsImage = yield Organization.exists({
                        _id: documentId,
                        image: imageUrl,
                    });
                    if (!hasEditPermission || !orgOwnsImage) {
                        yield createApiLog({
                            type: ApiLogTypes.MUTATION_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'deleteImageForUser',
                            functionParams: [
                                {
                                    paramName: 'userId',
                                    paramValue: decodedToken.UserId,
                                    paramType: typeof decodedToken.UserId,
                                },
                                {
                                    paramName: 'imageUrl',
                                    paramValue: imageUrl,
                                    paramType: typeof imageUrl,
                                },
                                {
                                    paramName: 'imageType',
                                    paramValue: imageType,
                                    paramType: typeof imageType,
                                },
                                {
                                    paramName: 'documentId',
                                    paramValue: documentId,
                                    paramType: typeof documentId,
                                },
                            ],
                            additionalMessage: 'Not Authorized: User Lacks Image Delete Permissions',
                            startLogId,
                        });
                        return {
                            message: 'Not Authorized',
                            status: 401,
                        };
                    }
                    break;
                case IMAGE_TYPE.PUBLICATION:
                    const hasPublicationPermission = yield Publication.exists({
                        userId: decodedToken.UserId,
                        image: imageUrl,
                    });
                    if (!hasPublicationPermission) {
                        yield createApiLog({
                            type: ApiLogTypes.MUTATION_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'deleteImageForUser',
                            functionParams: [
                                {
                                    paramName: 'userId',
                                    paramValue: decodedToken.UserId,
                                    paramType: typeof decodedToken.UserId,
                                },
                                {
                                    paramName: 'imageUrl',
                                    paramValue: imageUrl,
                                    paramType: typeof imageUrl,
                                },
                                {
                                    paramName: 'imageType',
                                    paramValue: imageType,
                                    paramType: typeof imageType,
                                },
                                {
                                    paramName: 'documentId',
                                    paramValue: documentId,
                                    paramType: typeof documentId,
                                },
                            ],
                            additionalMessage: 'Not Authorized: User Lacks Image Delete Permissions',
                            startLogId,
                        });
                        return {
                            message: 'Not Authorized',
                            status: 401,
                        };
                    }
                    break;
                case IMAGE_TYPE.SERVICE:
                    const hasServicePermission = yield Service.exists({
                        userId: decodedToken.UserId,
                        image: imageUrl,
                    });
                    if (!hasServicePermission) {
                        yield createApiLog({
                            type: ApiLogTypes.MUTATION_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'deleteImageForUser',
                            functionParams: [
                                {
                                    paramName: 'userId',
                                    paramValue: decodedToken.UserId,
                                    paramType: typeof decodedToken.UserId,
                                },
                                {
                                    paramName: 'imageUrl',
                                    paramValue: imageUrl,
                                    paramType: typeof imageUrl,
                                },
                                {
                                    paramName: 'imageType',
                                    paramValue: imageType,
                                    paramType: typeof imageType,
                                },
                                {
                                    paramName: 'documentId',
                                    paramValue: documentId,
                                    paramType: typeof documentId,
                                },
                            ],
                            additionalMessage: 'Not Authorized: User Lacks Image Delete Permissions',
                            startLogId,
                        });
                        return {
                            message: 'Not Authorized',
                            status: 401,
                        };
                    }
                    break;
                default:
                    break;
            }
            yield deleteImageFromBucket(imageUrl);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'deleteImageForUser',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'imageUrl',
                        paramValue: imageUrl,
                        paramType: typeof imageUrl,
                    },
                ],
                additionalMessage: `Image Deleted Successfully`,
                startLogId,
            });
            return {
                message: 'Image Deleted Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteImageForUser',
                    functionParams: [
                        {
                            paramName: 'imageUrl',
                            paramValue: imageUrl,
                            paramType: typeof imageUrl,
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
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'deleteImageForUser',
                functionParams: [
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'imageUrl',
                        paramValue: imageUrl,
                        paramType: typeof imageUrl,
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
//# sourceMappingURL=deleteImageForUser.js.map