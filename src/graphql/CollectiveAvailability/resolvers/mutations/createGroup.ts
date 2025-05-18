import CollectiveGroup from '../../../../MongoModels/CollectiveGroup';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {GROUP_LIMIT} from '../../../../constants/variables';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';

export default async function createGroup(parent, {groupData}, context, info) {
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createGroup',
      functionParams: [
        {
          paramName: 'groupData',
          paramValue: groupData,
          paramType: typeof groupData,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const hasExtension = await ActiveExtension.exists({
      userId: decodedToken.UserId,
      extensionProductId: stripeProductIDs.EXTENSIONS.COLLECTIVE_AVAILABILITY,
      status: {
        $in: ['paid', 'gifted'],
      },
    });

    if (!hasExtension) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createGroup',
        functionParams: [
          {
            paramName: 'groupData',
            paramValue: groupData,
            paramType: typeof groupData,
          },
        ],
        additionalMessage: 'User does not have COLLECTIVE_AVAILABILITY Extension',
        startLogId,
      });

      return {
        message: 'User does not have COLLECTIVE AVAILABILITY Extension',
        status: 400,
      };
    }

    let {guestIDs} = groupData;
    guestIDs = [...guestIDs];
    guestIDs = Array.from(new Set(guestIDs));

    if (guestIDs.length > GROUP_LIMIT) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createGroup',
        functionParams: [
          {
            paramName: 'groupData',
            paramValue: groupData,
            paramType: typeof groupData,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Number Of Group Members Exceeding Limit',
        startLogId,
      });

      return {
        message: `Collective Group Contains More Than ${GROUP_LIMIT} User`,
        status: 400,
      };
    }

    const name = `Group# ${guestIDs.length}`;
    const createdGroup = await CollectiveGroup.create({
      name,
      ownerID: decodedToken.UserId,
      guestIDs,
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createGroup',
      functionParams: [
        {
          paramName: 'groupData',
          paramValue: groupData,
          paramType: typeof groupData,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Group Created Successfully',
      startLogId,
    });

    return {
      message: 'Group Created Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createGroup',
        functionParams: [
          {
            paramName: 'groupData',
            paramValue: groupData,
            paramType: typeof groupData,
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

    if (err?._message === 'CollectiveGroup validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createGroup',
        functionParams: [
          {
            paramName: 'groupData',
            paramValue: groupData,
            paramType: typeof groupData,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Mongoose CollectiveGroup Validation Failed',
        startLogId,
      });

      return {
        message: err.message,
        status: 400,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'createGroup',
      functionParams: [
        {
          paramName: 'groupData',
          paramValue: groupData,
          paramType: typeof groupData,
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
}
