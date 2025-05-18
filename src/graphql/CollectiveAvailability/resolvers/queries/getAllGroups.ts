import CollectiveGroup from '../../../../MongoModels/CollectiveGroup';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';

export default async function getAllGroups(parent, {}, context, info) {
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  const {token} = context;
  let startLogId: String;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getAllGroups',
      functionParams: [
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
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getAllGroups',
        functionParams: [
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'User does not have COLLECTIVE AVAILABILITY Extension',
        startLogId,
      });

      return {
        message: 'User does not have COLLECTIVE AVAILABILITY Extension',
        status: 400,
      };
    }

    const groups = await CollectiveGroup.find({ownerID: decodedToken.UserId}).populate('guestIDs', [
      '_id',
      'accountDetails.email',
    ]);

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getAllGroups',
      functionParams: [
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'getAllGroup Query Successful',
      startLogId,
    });

    return {
      groupData: groups,
      response: {
        message: 'getAllGroup Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getAllGroups',
        functionParams: [],
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
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getAllGroups',
      functionParams: [
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
      groupData: [],
      response: {message: err.message, status: 500},
    };
  }
}
