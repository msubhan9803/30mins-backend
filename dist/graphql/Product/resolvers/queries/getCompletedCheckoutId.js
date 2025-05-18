var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import Checkout from '../../../../MongoModels/Checkout';
import ProductQtt from '../../../../MongoModels/ProductQtt';
import jwt from 'jsonwebtoken';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
export default function getCompletedCheckoutId(_, { checkoutID, token }) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
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
            const existingCheckout = yield Checkout.findById(checkoutID).populate('buyer');
            let isAuthenticated = false;
            const queryingUser = yield User.findById(decodedToken.UserId);
            if (((_a = queryingUser === null || queryingUser === void 0 ? void 0 : queryingUser.accountDetails) === null || _a === void 0 ? void 0 : _a.accountType) === 'admin') {
                isAuthenticated = true;
            }
            else if (((_b = existingCheckout === null || existingCheckout === void 0 ? void 0 : existingCheckout.buyer) === null || _b === void 0 ? void 0 : _b._id.toString()) === decodedToken.UserId) {
                isAuthenticated = true;
            }
            if (!isAuthenticated) {
                yield createApiLog({
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
            const productQtt = yield ProductQtt.aggregate([
                {
                    $match: { checkout: existingCheckout._id },
                },
                {
                    $lookup: {
                        from: 'checkouts',
                        localField: 'checkout',
                        foreignField: '_id',
                        as: 'checkout',
                    },
                },
                { $unwind: '$checkout' },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'product',
                    },
                },
                { $unwind: '$product' },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'product.seller',
                        foreignField: '_id',
                        as: 'product.seller',
                    },
                },
                { $unwind: '$product.seller' },
                {
                    $lookup: {
                        from: 'services',
                        localField: 'product.service',
                        foreignField: '_id',
                        as: 'product.service',
                    },
                },
                { $unwind: { path: '$product.service', preserveNullAndEmptyArrays: true } },
            ]);
            yield createApiLog({
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
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
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
            yield createApiLog({
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
    });
}
//# sourceMappingURL=getCompletedCheckoutId.js.map