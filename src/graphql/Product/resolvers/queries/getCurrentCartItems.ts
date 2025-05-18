import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Cart from '../../../../MongoModels/Cart';

export default async function getCurrentCartItems(_, {token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getCurrentCartItems',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'seller',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const cart = await Cart.findOne({buyer: decodedToken.UserId})
      .populate('buyer', ['_id'], 'User')
      .populate({
        path: 'products',
        populate: {
          path: 'product',
          populate: {
            path: 'seller',
            model: 'User',
          },
        },
      });

    const sellers = cart.products.map(elem => elem.product.seller);

    const unique = [];
    const distinct = [];
    const distinctSellerObjsList = [];
    for (let i = 0; i < sellers.length; i++) {
      if (!unique[sellers[i]._id]) {
        distinct.push(sellers[i]._id);
        distinctSellerObjsList.push(sellers[i]);
        unique[sellers[i]._id] = 1;
      }
    }

    const newAggregatedCart = [];
    for (let i = 0; i < distinct.length; i++) {
      const sellerId = distinct[i];
      const productQtts = cart.products.filter(
        productQtt => productQtt.product.seller._id === sellerId
      );

      newAggregatedCart.push({
        seller: distinctSellerObjsList[i],
        productQtts,
      });
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getCurrentCartItems',
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
      additionalMessage: 'Cart Query Successful',
      startLogId,
    });

    return {
      cart: newAggregatedCart,
      response: {
        message: 'Cart Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getCurrentCartItems',
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

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getCurrentCartItems',
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
}
