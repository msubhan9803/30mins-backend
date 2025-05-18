import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Cart from '../../../../MongoModels/Cart';
import ProductQtt from '../../../../MongoModels/ProductQtt';

export default async function updateCart(parent, {productQttId, productId, quantity, token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateCart',
      functionParams: [
        {
          paramName: 'productId',
          paramValue: productId,
          paramType: typeof productId,
        },
        {
          paramName: 'quantity',
          paramValue: quantity,
          paramType: typeof quantity,
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

    const alreadyCreatedCart = await Cart.findOne({buyer: decodedToken.UserId});

    if (productQttId) {
      const alreadyCreatedProduct = await ProductQtt.findById(productQttId);
      alreadyCreatedProduct.quantity = quantity;
      await alreadyCreatedProduct.save();
    } else {
      let createdProductQtt = await ProductQtt.create({
        quantity,
        product: productId,
        checkout: null,
        checkoutPrice: null,
      });
      createdProductQtt = await createdProductQtt.save();

      alreadyCreatedCart.products.push(createdProductQtt._id);
      await alreadyCreatedCart.save();
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'updateCart',
      functionParams: [
        {
          paramName: 'productId',
          paramValue: productId,
          paramType: typeof productId,
        },
        {
          paramName: 'quantity',
          paramValue: quantity,
          paramType: typeof quantity,
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
      additionalMessage: 'Product updated in the cart successfully',
      startLogId,
    });

    return {
      message: 'Product updated in the cart successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateCart',
        functionParams: [
          {
            paramName: 'productId',
            paramValue: productId,
            paramType: typeof productId,
          },
          {
            paramName: 'quantity',
            paramValue: quantity,
            paramType: typeof quantity,
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

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    if (err?._message === 'Post validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'updateCart',
        functionParams: [
          {
            paramName: 'productId',
            paramValue: productId,
            paramType: typeof productId,
          },
          {
            paramName: 'quantity',
            paramValue: quantity,
            paramType: typeof quantity,
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

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'updateCart',
      functionParams: [
        {
          paramName: 'productId',
          paramValue: productId,
          paramType: typeof productId,
        },
        {
          paramName: 'quantity',
          paramValue: quantity,
          paramType: typeof quantity,
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
}
