import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import Checkout from '../../../../MongoModels/Checkout';
import ProductQtt from '../../../../MongoModels/ProductQtt';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';

export default async function getCompletedCheckoutId(_, {checkoutID, token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getCompletedCheckoutId',
      functionParams: [
        {
          paramName: 'checkoutID',
          paramValue: checkoutID,
          paramType: typeof checkoutID,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
    });

    const existingCheckout = await Checkout.findById(checkoutID).populate('buyer');

    let isAuthenticated = false;
    const queryingUser = await User.findById(decodedToken.UserId);

    if (queryingUser?.accountDetails?.accountType === 'admin') {
      isAuthenticated = true;
    } else if (existingCheckout?.buyer?._id.toString() === decodedToken.UserId) {
      isAuthenticated = true;
    }

    if (!isAuthenticated) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCompletedCheckoutId',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'checkoutID',
            paramValue: checkoutID,
            paramType: typeof checkoutID,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Document Not Found',
        startLogId,
      });

      return {
        response: {
          message: 'Document Not Found',
          status: 404,
        },
      };
    }

    const productQtt = await ProductQtt.aggregate([
      {
        $match: {checkout: existingCheckout._id},
      },
      {
        $lookup: {
          from: 'checkouts',
          localField: 'checkout',
          foreignField: '_id',
          as: 'checkout',
        },
      },
      {$unwind: '$checkout'},
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {$unwind: '$product'},
      {
        $lookup: {
          from: 'users',
          localField: 'product.seller',
          foreignField: '_id',
          as: 'product.seller',
        },
      },
      {$unwind: '$product.seller'},
      {
        $lookup: {
          from: 'services',
          localField: 'product.service',
          foreignField: '_id',
          as: 'product.service',
        },
      },
      {$unwind: {path: '$product.service', preserveNullAndEmptyArrays: true}},
    ]);

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getCompletedCheckoutId',
      functionParams: [
        {
          paramName: 'checkoutID',
          paramValue: checkoutID,
          paramType: typeof checkoutID,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
      additionalMessage: 'Get Completed Checkout Query Successful',
      startLogId,
    });

    return {
      response: {
        message: 'Get Completed Checkout Query Successful',
        status: 200,
      },
      checkout: existingCheckout,
      productQtt,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCompletedCheckoutId',
        functionParams: [
          {
            paramName: 'checkoutID',
            paramValue: checkoutID,
            paramType: typeof checkoutID,
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
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getCompletedCheckoutId',
      functionParams: [
        {
          paramName: 'checkoutID',
          paramValue: checkoutID,
          paramType: typeof checkoutID,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
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
