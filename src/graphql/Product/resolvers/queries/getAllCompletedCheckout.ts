import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import ProductQtt from '../../../../MongoModels/ProductQtt';
import Checkout from '../../../../MongoModels/Checkout';

export default async function getAllCompletedCheckout(_, {token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getAllCompletedCheckout',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
    });

    const checkout = await Checkout.find({buyer: decodedToken.UserId});
    const checkoutIdsList = Array.from(new Set(checkout.map(elem => elem._id)));

    const productQtts = await ProductQtt.aggregate([
      {
        $match: {checkout: {$in: checkoutIdsList}},
      },
      {
        $project: {
          _id: 1,
          totalPrice: {$multiply: ['$checkoutPrice', '$quantity']},
          quantity: 1,
          checkout: 1,
        },
      },
      {
        $group: {
          _id: '$checkout',
          total: {$sum: '$totalPrice'},
          countOfItems: {$sum: '$quantity'},
        },
      },
      {
        $lookup: {
          from: 'checkouts',
          localField: '_id',
          foreignField: '_id',
          as: 'checkout',
        },
      },
      {$unwind: '$checkout'},
    ]);

    const productQtts2 = await ProductQtt.aggregate([
      {
        $match: {checkout: {$in: checkoutIdsList}},
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
        $group: {
          _id: {
            seller: '$product.seller',
            checkout: '$checkout',
          },
        },
      },
    ]);
    const mergedTable = productQtts.map(obj1 => {
      const obj2 = productQtts2.find(
        obj => obj1._id.toString() === obj._id.checkout._id.toString()
      );
      return {...obj1, seller: obj2?._id?.seller};
    });

    const mergedTableSorted = mergedTable.sort((element1, element2) => {
      if (element1.checkout.createdAt < element2.checkout.createdAt) {
        return 1;
      }
      if (element1.checkout.createdAt > element2.checkout.createdAt) {
        return -1;
      }
      return 0;
    });

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getAllCompletedCheckout',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
      additionalMessage: 'All Command Index Query Successful',
      startLogId,
    });

    return {
      response: {
        message: 'All Command Index Query Successful',
        status: 200,
      },
      maxNavigation: mergedTableSorted.length,
      checkouts: mergedTableSorted,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getAllCompletedCheckout',
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

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getAllCompletedCheckout',
      functionParams: [
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
