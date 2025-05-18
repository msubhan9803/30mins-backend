import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Service from '../../../../MongoModels/Service';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import mongoose from 'mongoose';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

export default async function getUserDashboardData(parent, {token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUserDashboardData',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const hasPaidService = await Service.exists({userId: decodedToken.UserId, isPaid: true});

    const totalRevenueData = await BookedMeeting.aggregate([
      {$match: {provider: new mongoose.mongo.ObjectId(decodedToken.UserId), price: {$gt: 0}}},
      {$group: {_id: '$currency', revenue: {$push: '$price'}}},
      {
        $addFields: {
          totalRevenue: {$sum: '$revenue'},
        },
      },
      {$project: {_id: 1, revenue: 0}},
    ]);

    const orgMemberships = await OrganizationMembership.find({
      userId: decodedToken?.UserId,
    }).populate('organizationId');
    const formattedOrgData = orgMemberships.map(membership => {
      const referralCount = membership?.organizationId?.referralCount || 0;
      return {organizationTitle: membership?.organizationId?.title, count: referralCount};
    });

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUserDashboardData',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      hasPaidService,
      totalRevenueData,
      orgSignups: formattedOrgData || [],
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserDashboardData',
        functionParams: [{paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token}],
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

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getUserDashboardData',
      functionParams: [
        {paramName: 'token', paramValue: 'HIDDEN_TOKEN', paramType: typeof token},
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
}
