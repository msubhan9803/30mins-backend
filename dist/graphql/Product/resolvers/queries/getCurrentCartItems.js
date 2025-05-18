var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Cart from '../../../../MongoModels/Cart';
export default function getCurrentCartItems(_, { token }) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
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
            const cart = yield Cart.findOne({ buyer: decodedToken.UserId })
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
                const productQtts = cart.products.filter(productQtt => productQtt.product.seller._id === sellerId);
                newAggregatedCart.push({
                    seller: distinctSellerObjsList[i],
                    productQtts,
                });
            }
            yield createApiLog({
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
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
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
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
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
    });
}
//# sourceMappingURL=getCurrentCartItems.js.map