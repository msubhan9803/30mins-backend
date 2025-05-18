/* eslint-disable no-await-in-loop */
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Cart from '../../../../MongoModels/Cart';
import Checkout from '../../../../MongoModels/Checkout';
import ProductQtt from '../../../../MongoModels/ProductQtt';
import User from '../../../../MongoModels/User';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import {EscrowReleaseStatus} from '../../../../constants/enums';
import agenda from '../../../../lib/agenda';
import dayjs from 'dayjs';
import Product from '../../../../MongoModels/Product';

function getExistingProductQtts(products) {
  return ProductQtt.find({
    _id: {$in: products},
  }).populate({
    path: 'product',
    populate: {
      path: 'seller',
      model: 'User',
    },
  });
}

export default async function checkout(parent, {token}) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  const SECRETS = await AwsSecrets.getInstance();
  let startLogId: String;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const agendaInstance = await agenda.getInstance();
    startLogId = await createApiLog({
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

    let checkoutCart = await Checkout.create({
      buyer: decodedToken.UserId,
    });
    checkoutCart = await checkoutCart.save();

    const buyer = await User.findById(decodedToken.UserId);
    const existingCartCheck = await Cart.findOne({buyer: decodedToken.UserId});
    let existingProductQttModelList = await getExistingProductQtts(existingCartCheck.products);
    if (existingProductQttModelList.length === 0) {
      return {
        message: 'No products in cart',
        status: 404,
      };
    }

    const productIDs = existingProductQttModelList.map(productQTTData =>
      productQTTData.product._id.toString()
    );
    await Product.updateMany({_id: {$in: productIDs}}, {$inc: {totalPurchases: 1}});

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

      const {product} = productQtt;
      productQtt.checkout = checkoutCart._id;
      productQtt.checkoutPrice = Math.floor(
        Math.floor(product?.price) - (Math.floor(product?.price) * Number(product?.discount)) / 100
      );
      const upatedProductQtt = await productQtt.save();

      const {seller} = product;
      const providerPayoutType = seller?.accountDetails?.paymentAccounts?.escrow[0];
      const providerPayoutId = seller?.accountDetails[providerPayoutType];

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

        await agendaInstance.schedule(scheduledTime, 'createProductsEscrowPayout', {
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
    await sendEmail(buyerEmailPayload, buyerEmail, TEMPLATES.PRODUCT.EMAIL_TO_BUYER);

    existingProductQttModelList = await getExistingProductQtts(existingCartCheck.products);

    const sellerObjWithTheirProductQtts = [];
    for (let i = 0; i < distinct.length; i++) {
      const sellerId = distinct[i].toString();
      const productQtts = existingProductQttModelList.filter(
        productQtt => productQtt.product.seller._id.toString() === sellerId
      );

      sellerObjWithTheirProductQtts.push({
        seller: distinctSellerObjsList[i],
        productQtts,
      });
    }

    for (let Products = 0; Products < sellerObjWithTheirProductQtts.length; Products++) {
      const {seller, productQtts} = sellerObjWithTheirProductQtts[Products];
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
      await sendEmail(sellerEmailPayload, sellerEmail, TEMPLATES.PRODUCT.EMAIL_TO_SELLER);

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

        await agendaInstance.schedule(scheduledTime, 'sendProductEscrowReleaseEmail', {
          emailData: EMAIL_DATA,
          emailSendTo: SECRETS.ESCROW_30MIN_EMAIL,
        });
      }
    }

    existingCartCheck.products = [];
    await existingCartCheck.save();

    await createApiLog({
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
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
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

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    if (err?._message === 'Post validation failed') {
      await createApiLog({
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

    await createApiLog({
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
}
