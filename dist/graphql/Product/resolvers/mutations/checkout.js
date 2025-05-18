var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable no-await-in-loop */
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Cart from '../../../../MongoModels/Cart';
import Checkout from '../../../../MongoModels/Checkout';
import ProductQtt from '../../../../MongoModels/ProductQtt';
import User from '../../../../MongoModels/User';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import { EscrowReleaseStatus } from '../../../../constants/enums';
import agenda from '../../../../lib/agenda';
import dayjs from 'dayjs';
import Product from '../../../../MongoModels/Product';
function getExistingProductQtts(products) {
    return ProductQtt.find({
        _id: { $in: products },
    }).populate({
        path: 'product',
        populate: {
            path: 'seller',
            model: 'User',
        },
    });
}
export default function checkout(parent, { token }) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const SECRETS = yield AwsSecrets.getInstance();
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const agendaInstance = yield agenda.getInstance();
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'checkout',
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
            });
            let checkoutCart = yield Checkout.create({
                buyer: decodedToken.UserId,
            });
            checkoutCart = yield checkoutCart.save();
            const buyer = yield User.findById(decodedToken.UserId);
            const existingCartCheck = yield Cart.findOne({ buyer: decodedToken.UserId });
            let existingProductQttModelList = yield getExistingProductQtts(existingCartCheck.products);
            if (existingProductQttModelList.length === 0) {
                return {
                    message: 'No products in cart',
                    status: 404,
                };
            }
            const productIDs = existingProductQttModelList.map(productQTTData => productQTTData.product._id.toString());
            yield Product.updateMany({ _id: { $in: productIDs } }, { $inc: { totalPurchases: 1 } });
            let total = 0;
            const productListForEmail = [];
            const sellers = existingProductQttModelList.map(elem => elem.product.seller);
            const unique = [];
            const distinct = [];
            const distinctSellerObjsList = [];
            const TOTAL_FEE = parseFloat(SECRETS.ESCROW_SERVICE_FEE_PERCENT);
            for (let Products = 0; Products < existingProductQttModelList.length; Products++) {
                const productQtt = existingProductQttModelList[Products];
                if (!unique[sellers[Products]._id]) {
                    distinct.push(sellers[Products]._id);
                    distinctSellerObjsList.push(sellers[Products]);
                    unique[sellers[Products]._id] = 1;
                }
                const { product } = productQtt;
                productQtt.checkout = checkoutCart._id;
                productQtt.checkoutPrice = Math.floor(Math.floor(product === null || product === void 0 ? void 0 : product.price) - (Math.floor(product === null || product === void 0 ? void 0 : product.price) * Number(product === null || product === void 0 ? void 0 : product.discount)) / 100);
                const upatedProductQtt = yield productQtt.save();
                const { seller } = product;
                const providerPayoutType = (_b = (_a = seller === null || seller === void 0 ? void 0 : seller.accountDetails) === null || _a === void 0 ? void 0 : _a.paymentAccounts) === null || _b === void 0 ? void 0 : _b.escrow[0];
                const providerPayoutId = seller === null || seller === void 0 ? void 0 : seller.accountDetails[providerPayoutType];
                const checkoutSubtotal = productQtt.checkoutPrice * productQtt.quantity;
                const ESCROW_AMOUNT_TO_RELEASE = checkoutSubtotal - checkoutSubtotal * TOTAL_FEE;
                if (ESCROW_AMOUNT_TO_RELEASE > 0) {
                    const scheduledTime = dayjs().add(3, 'day').toDate();
                    const payoutData = {
                        providerEmail: seller.accountDetails.email,
                        providerPayoutMethod: {
                            payoutType: providerPayoutType,
                            payoutId: providerPayoutId,
                        },
                        bookerEmail: buyer.accountDetails.email,
                        amountToRelease: ESCROW_AMOUNT_TO_RELEASE,
                        bookingId: productQtt._id,
                        status: EscrowReleaseStatus.UNRELEASED,
                        dateReleased: Date.now(),
                    };
                    yield agendaInstance.schedule(scheduledTime, 'createProductsEscrowPayout', {
                        payoutData,
                    });
                }
                const obj = {
                    title: upatedProductQtt.product.title,
                    image: upatedProductQtt.product.image,
                    quantity: upatedProductQtt.quantity,
                    checkoutPrice: upatedProductQtt.checkoutPrice,
                    fileLink: `https://30mins.com/user/purchases/${upatedProductQtt.checkout.toString()}`,
                    resText: upatedProductQtt.product.resText || null,
                    subTotal: upatedProductQtt.checkoutPrice * upatedProductQtt.quantity,
                    authCode: upatedProductQtt.authCode,
                    checkoutId: upatedProductQtt.checkout.toString(),
                };
                total += obj.quantity * obj.checkoutPrice;
                productListForEmail.push(obj);
            }
            const buyerName = buyer.personalDetails.name;
            const buyerEmail = buyer.accountDetails.email;
            // Email to Buyer
            const buyerEmailPayload = {
                receipt: true,
                items: productListForEmail,
                total,
                buyerName,
                frontendUrl: 'https://30mins.com',
            };
            yield sendEmail(buyerEmailPayload, buyerEmail, TEMPLATES.PRODUCT.EMAIL_TO_BUYER);
            existingProductQttModelList = yield getExistingProductQtts(existingCartCheck.products);
            const sellerObjWithTheirProductQtts = [];
            for (let i = 0; i < distinct.length; i++) {
                const sellerId = distinct[i].toString();
                const productQtts = existingProductQttModelList.filter(productQtt => productQtt.product.seller._id.toString() === sellerId);
                sellerObjWithTheirProductQtts.push({
                    seller: distinctSellerObjsList[i],
                    productQtts,
                });
            }
            for (let Products = 0; Products < sellerObjWithTheirProductQtts.length; Products++) {
                const { seller, productQtts } = sellerObjWithTheirProductQtts[Products];
                const sellerName = seller.personalDetails.name;
                const sellerEmail = seller.accountDetails.email;
                let totalForSeller = 0;
                const sellerProductQttListForEmail = productQtts.map(elem => {
                    const obj = {
                        title: elem.product.title,
                        image: elem.product.image,
                        quantity: elem.quantity,
                        checkoutPrice: elem.checkoutPrice,
                        fileLink: elem.product.file.link || null,
                        resText: elem.product.resText || null,
                        subTotal: elem.checkoutPrice * elem.quantity,
                    };
                    totalForSeller += obj.quantity * obj.checkoutPrice;
                    return obj;
                });
                const ESCROW_AMOUNT_TO_RELEASE = totalForSeller - totalForSeller * TOTAL_FEE;
                // Email to Seller
                const sellerEmailPayload = {
                    receipt: true,
                    items: sellerProductQttListForEmail,
                    total: totalForSeller,
                    totalAfterFees: ESCROW_AMOUNT_TO_RELEASE,
                    sellerName,
                    buyerName,
                };
                yield sendEmail(sellerEmailPayload, sellerEmail, TEMPLATES.PRODUCT.EMAIL_TO_SELLER);
                if (ESCROW_AMOUNT_TO_RELEASE > 0) {
                    const scheduledTime = dayjs().add(3, 'day').toDate();
                    const EMAIL_DATA = {
                        sellerName,
                        sellerEmail,
                        buyerName,
                        buyerEmail,
                        totalCheckoutAmount: totalForSeller,
                        productQttIds: productQtts.map(elem => elem._id),
                        productQttCount: productQtts.length,
                        amountToRelease: ESCROW_AMOUNT_TO_RELEASE,
                        currency: '$',
                    };
                    yield agendaInstance.schedule(scheduledTime, 'sendProductEscrowReleaseEmail', {
                        emailData: EMAIL_DATA,
                        emailSendTo: SECRETS.ESCROW_30MIN_EMAIL,
                    });
                }
            }
            existingCartCheck.products = [];
            yield existingCartCheck.save();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'checkout',
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
                additionalMessage: 'Products checkout successfully',
                startLogId,
            });
            return {
                response: {
                    message: 'Products checkout successfully',
                    status: 200,
                },
                checkoutId: checkoutCart._id,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkout',
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
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Post validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkout',
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
                functionName: 'checkout',
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
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=checkout.js.map