import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Cart from '../../../../MongoModels/Cart';
import ProductQtt from '../../../../MongoModels/ProductQtt';

export default async function deleteCart(parent, {productQttId, token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'deleteCart',
      functionParams: [
        {
          paramName: 'productQttId',
          paramValue: productQttId,
          paramType: typeof productQttId,
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

    const productQtt = await ProductQtt.findById(productQttId);
    if (!productQtt) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteCart',
        functionParams: [
          {
            paramName: 'productQttId',
            paramValue: productQttId,
            paramType: typeof productQttId,
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
        additionalMessage: 'Not Found',
        startLogId,
      });

      return {
        message: 'Document Not Found',
        status: 404,
      };
    }

    const alreadyCreatedCart = await Cart.findOne({buyer: decodedToken.UserId});
    alreadyCreatedCart.products = alreadyCreatedCart.products.filter(
      productId => productId.toString() !== productQttId
    );
    await alreadyCreatedCart.save();

    await ProductQtt.deleteOne({_id: productQttId});

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'deleteCart',
      functionParams: [
        {
          paramName: 'productQttId',
          paramValue: productQttId,
          paramType: typeof productQttId,
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
      additionalMessage: 'Product deleted from the cart successfully',
      startLogId,
    });

    return {
      message: 'Product deleted from the cart successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteCart',
        functionParams: [
          {
            paramName: 'productQttId',
            paramValue: productQttId,
            paramType: typeof productQttId,
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
        functionName: 'deleteCart',
        functionParams: [
          {
            paramName: 'productQttId',
            paramValue: productQttId,
            paramType: typeof productQttId,
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
      functionName: 'deleteCart',
      functionParams: [
        {
          paramName: 'productQttId',
          paramValue: productQttId,
          paramType: typeof productQttId,
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
