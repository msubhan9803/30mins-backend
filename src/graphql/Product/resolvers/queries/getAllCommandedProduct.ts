import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Product from '../../../../MongoModels/Product';
import ProductQtt from '../../../../MongoModels/ProductQtt';

export default async function getAllCommandedProduct(_, {token, searchParams}) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getAllCommandedProduct',
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
    const {pageNumber, resultsPerPage} = searchParams;

    const skipCount = pageNumber * resultsPerPage - resultsPerPage;
    const currentSellerProducts = await Product.find({seller: decodedToken.UserId}, 'id');
    const productIdsList = currentSellerProducts.map(elem => elem._id);

    const existingProductQttModelList = await ProductQtt.find({
      product: {$in: productIdsList},
      checkout: {$ne: null},
    })
      .populate('checkout')
      .populate('product')
      .skip(skipCount)
      .limit(resultsPerPage)
      .exec();

    const maxNavigation = await ProductQtt.find({
      product: {$in: productIdsList},
      checkout: {$ne: null},
    }).count();

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getAllCommandedProduct',
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
      additionalMessage: 'All Command Index Query Successful',
      startLogId,
    });

    return {
      productQtt: existingProductQttModelList,
      maxNavigation: maxNavigation,
      response: {
        message: 'All Command Index Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getAllCommandedProduct',
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
      functionName: 'getAllCommandedProduct',
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
