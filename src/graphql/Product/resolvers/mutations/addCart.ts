import jwt from 'jsonwebtoken';
import {v4 as uuid} from 'uuid';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Cart from '../../../../MongoModels/Cart';
import ProductQtt from '../../../../MongoModels/ProductQtt';
import Product from '../../../../MongoModels/Product';

export default async function addCart(parent, {productId, quantity, token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'addCart',
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

    const product = await Product.findById(productId);

    if (!product?.price) {
      const preexistingDownload = await ProductQtt.findOne({
        product: productId,
        buyerId: decodedToken.UserId,
        checkout: {$ne: null},
      });

      if (preexistingDownload) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.INFO,
          functionName: 'addCart',
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
          additionalMessage: 'User has Preexisting Download - Returning 409',
          startLogId,
        });

        return {
          message: preexistingDownload.checkout.toString(),
          status: 409,
        };
      }
    }

    const existingCartCheck = await Cart.findOne({buyer: decodedToken.UserId});
    if (!existingCartCheck) {
      let createdProductQtt = await ProductQtt.create({
        quantity,
        product: productId,
        checkout: null,
        checkoutPrice: null,
        authCode: uuid(),
        buyerId: decodedToken.UserId,
      });
      createdProductQtt = await createdProductQtt.save();

      const createdCart = await Cart.create({
        buyer: decodedToken.UserId,
        products: [createdProductQtt._id],
      });

      await createdCart.save();
    } else {
      let isProductQttExisting = false;
      const existingProductQttModelList = await ProductQtt.find({
        _id: {$in: existingCartCheck.products},
      });
      const currentProductQttIndex = existingProductQttModelList.findIndex(
        productQtt => productQtt.product.toString() === productId
      );

      if (currentProductQttIndex > -1) {
        isProductQttExisting = true;
      }

      if (!isProductQttExisting) {
        let createdProductQtt = await ProductQtt.create({
          quantity,
          product: productId,
          checkout: null,
          checkoutPrice: null,
          authCode: uuid(),
          buyerId: decodedToken.UserId,
        });
        createdProductQtt = await createdProductQtt.save();

        existingCartCheck.products.push(createdProductQtt._id);
        await existingCartCheck.save();
      } else {
        const productQtt = existingProductQttModelList[currentProductQttIndex];
        productQtt.quantity = quantity;
        await productQtt.save();
      }
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'addCart',
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
      additionalMessage: 'Product added to the cart successfully',
      startLogId,
    });

    return {
      message: 'Product added to the cart successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'addCart',
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
        functionName: 'addCart',
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
      functionName: 'addCart',
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
