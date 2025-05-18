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
import { v4 as uuid } from 'uuid';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Cart from '../../../../MongoModels/Cart';
import ProductQtt from '../../../../MongoModels/ProductQtt';
import Product from '../../../../MongoModels/Product';
export default function addCart(parent, { productId, quantity, token }) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
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
            const product = yield Product.findById(productId);
            if (!(product === null || product === void 0 ? void 0 : product.price)) {
                const preexistingDownload = yield ProductQtt.findOne({
                    product: productId,
                    buyerId: decodedToken.UserId,
                    checkout: { $ne: null },
                });
                if (preexistingDownload) {
                    yield createApiLog({
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
            const existingCartCheck = yield Cart.findOne({ buyer: decodedToken.UserId });
            if (!existingCartCheck) {
                let createdProductQtt = yield ProductQtt.create({
                    quantity,
                    product: productId,
                    checkout: null,
                    checkoutPrice: null,
                    authCode: uuid(),
                    buyerId: decodedToken.UserId,
                });
                createdProductQtt = yield createdProductQtt.save();
                const createdCart = yield Cart.create({
                    buyer: decodedToken.UserId,
                    products: [createdProductQtt._id],
                });
                yield createdCart.save();
            }
            else {
                let isProductQttExisting = false;
                const existingProductQttModelList = yield ProductQtt.find({
                    _id: { $in: existingCartCheck.products },
                });
                const currentProductQttIndex = existingProductQttModelList.findIndex(productQtt => productQtt.product.toString() === productId);
                if (currentProductQttIndex > -1) {
                    isProductQttExisting = true;
                }
                if (!isProductQttExisting) {
                    let createdProductQtt = yield ProductQtt.create({
                        quantity,
                        product: productId,
                        checkout: null,
                        checkoutPrice: null,
                        authCode: uuid(),
                        buyerId: decodedToken.UserId,
                    });
                    createdProductQtt = yield createdProductQtt.save();
                    existingCartCheck.products.push(createdProductQtt._id);
                    yield existingCartCheck.save();
                }
                else {
                    const productQtt = existingProductQttModelList[currentProductQttIndex];
                    productQtt.quantity = quantity;
                    yield productQtt.save();
                }
            }
            yield createApiLog({
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
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
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
            const decodedToken = jwt.verify(token, accessTokenSecret);
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Post validation failed') {
                yield createApiLog({
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
            yield createApiLog({
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
    });
}
//# sourceMappingURL=addCart.js.map