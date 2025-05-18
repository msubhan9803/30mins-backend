import jwt from 'jsonwebtoken';
import {IMAGE_TYPE} from '../../constants/enums';
import {AccessToken} from '../../constants/types';
import Organization from '../../MongoModels/Organization';
import OrganizationMembership from '../../MongoModels/OrganizationMembership';
import Publication from '../../MongoModels/Publication';
import Service from '../../MongoModels/Service';
import User from '../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../utils/createApiLog';
import deleteImageFromBucket from '../../utils/deleteImageFromBucket';
import AwsSecrets from '../../utils/getAwsSecrets';

export default async function deleteImageForUser(
  parent,
  {imageUrl, imageType, documentId},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const {token} = context;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
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
        const isOwnerOfImage = await User.exists({
          _id: decodedToken.UserId,
          'accountDetails.avatar': imageUrl,
        });

        if (!isOwnerOfImage) {
          await createApiLog({
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
        const hasEditPermission = await OrganizationMembership.exists({
          userId: decodedToken.UserId,
          organizationId: documentId,
          role: {$in: ['owner', 'admin']},
        });

        const orgOwnsImage = await Organization.exists({
          _id: documentId,
          image: imageUrl,
        });

        if (!hasEditPermission || !orgOwnsImage) {
          await createApiLog({
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
        const hasPublicationPermission = await Publication.exists({
          userId: decodedToken.UserId,
          image: imageUrl,
        });

        if (!hasPublicationPermission) {
          await createApiLog({
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
        const hasServicePermission = await Service.exists({
          userId: decodedToken.UserId,
          image: imageUrl,
        });

        if (!hasServicePermission) {
          await createApiLog({
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

    await deleteImageFromBucket(imageUrl);

    await createApiLog({
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
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
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

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    await createApiLog({
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
}
