import jwt from 'jsonwebtoken';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import {AccessToken} from '../../../../constants/types';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {PRODUCTQTT_REFUND_TYPES} from '../../../../constants/enums';
import ProductQtt from '../../../../MongoModels/ProductQtt';
import User from '../../../../MongoModels/User';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import dayjs from 'dayjs';

export default async function productQttUpdateStatus(
  parent,
  {token, productQttId, authCode, action, refundReason}
) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;

  try {
    const decodedToken = !token
      ? null
      : (jwt.verify(token, accessTokenSecret) as unknown as AccessToken);

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'productQttUpdateStatus',
      functionParams: [
        {
          paramName: 'productQttId',
          paramValue: productQttId,
          paramType: typeof productQttId,
        },
        {
          paramName: 'authCode',
          paramValue: authCode,
          paramType: typeof authCode,
        },
        {
          paramName: 'action',
          paramValue: action,
          paramType: typeof action,
        },
      ],
    });

    let productQtt = null;
    if (productQttId !== null) {
      productQtt = await ProductQtt.findById(productQttId)
        .populate({
          path: 'product',
          populate: {
            path: 'seller',
            model: 'User',
          },
        })
        .populate({
          path: 'checkout',
          populate: {
            path: 'buyer',
            model: 'User',
          },
        });
    } else if (authCode !== null) {
      productQtt = await ProductQtt.findOne({authCode})
        .populate({
          path: 'product',
          populate: {
            path: 'seller',
            model: 'User',
          },
        })
        .populate({
          path: 'checkout',
          populate: {
            path: 'buyer',
            model: 'User',
          },
        });
      if (productQtt.authCodeUsed) {
        return {
          message: 'Already refunded',
          status: 400,
        };
      }
      productQtt.authCodeUsed = true;
    }

    const {checkout, product} = productQtt;
    const buyerEmail = checkout.buyer.accountDetails.email;
    const buyerName = checkout.buyer.personalDetails.name;
    const sellerName = product.seller.personalDetails.name;
    const sellerEmail = product.seller.accountDetails.email;
    const TOTAL_FEE = parseFloat(SECRETS.ESCROW_SERVICE_FEE_PERCENT);
    const checkoutSubtotal = productQtt.checkoutPrice * productQtt.quantity;
    const ESCROW_AMOUNT_TO_RELEASE = checkoutSubtotal - checkoutSubtotal * TOTAL_FEE;
    let emailPayload = null;

    if (action === PRODUCTQTT_REFUND_TYPES.PENDING_ACTION) {
      if (productQtt.refundRequested) {
        return {
          message: 'Already requested for refund',
          status: 400,
        };
      }

      if (
        token &&
        decodedToken &&
        decodedToken.UserId.toString() !== productQtt.checkout.buyer._id.toString()
      ) {
        return {
          message: 'Not Authorized',
          status: 401,
        };
      }

      const threeDaysInMilliseconds = 3 * 24 * 3600 * 1000;
      const creationDate = dayjs(productQtt.createdAt);
      const currentDate = dayjs();
      if (currentDate.isAfter(creationDate.add(threeDaysInMilliseconds, 'millisecond'))) {
        return {
          message: 'Cannot refund after 3 days',
          status: 400,
        };
      }
      productQtt.refundRequested = true;
      productQtt.refundStatus = PRODUCTQTT_REFUND_TYPES.PENDING_ACTION;
      productQtt.refundReason = refundReason;
      emailPayload = {
        text: `${buyerName} initiated refund request`,
        sellerName,
        sellerEmail,
        buyerName,
        buyerEmail,
        refundAmountText: `Amount to be Released to Buyer: $ ${ESCROW_AMOUNT_TO_RELEASE}`,
        type: 'refund_requested',
        productQttId: productQtt._id.toString(),
        productTitle: productQtt.product.title,
        image: productQtt.product.image,
        productQuantity: productQtt.quantity,
        checkoutPrice: productQtt.checkoutPrice,
      };
    }

    if (token && productQtt && !authCode && action !== PRODUCTQTT_REFUND_TYPES.PENDING_ACTION) {
      const user = await User.findById(decodedToken.UserId);
      if (user.accountDetails.accountType !== 'admin') {
        return {
          message: 'Not Authorized',
          status: 401,
        };
      }

      if (action === PRODUCTQTT_REFUND_TYPES.REFUNDED) {
        productQtt.refundStatus = PRODUCTQTT_REFUND_TYPES.REFUNDED;
        emailPayload = {
          text: `${buyerName} has been refunded`,
          sellerName,
          sellerEmail,
          buyerName,
          buyerEmail,
          refundAmountText: `Amount Released to Buyer: $${ESCROW_AMOUNT_TO_RELEASE}`,
          type: 'refunded',
          productQttId: productQtt._id.toString(),
          productTitle: productQtt.product.title,
          image: productQtt.product.image,
          productQuantity: productQtt.quantity,
          checkoutPrice: productQtt.checkoutPrice,
        };
      }

      if (action === PRODUCTQTT_REFUND_TYPES.REFUND_DENIED) {
        productQtt.refundStatus = PRODUCTQTT_REFUND_TYPES.REFUND_DENIED;
        emailPayload = {
          text: `Refund request of buyer ${buyerName} has been denied`,
          sellerName,
          sellerEmail,
          buyerName,
          buyerEmail,
          refundAmountText: ``,
          type: 'refund_denied',
          productQttId: productQtt._id.toString(),
          productTitle: productQtt.product.title,
          image: productQtt.product.image,
          productQuantity: productQtt.quantity,
          checkoutPrice: productQtt.checkoutPrice,
        };
      }
    }

    await sendEmail(emailPayload, buyerEmail, TEMPLATES.PRODUCT.REFUND_EMAIL);
    await sendEmail(emailPayload, sellerEmail, TEMPLATES.PRODUCT.REFUND_EMAIL);
    await sendEmail(emailPayload, SECRETS.ESCROW_30MIN_EMAIL, TEMPLATES.PRODUCT.REFUND_EMAIL);
    await productQtt.save();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'productQttUpdateStatus',
      functionParams: [
        {
          paramName: 'productQttId',
          paramValue: productQttId,
          paramType: typeof productQttId,
        },
        {
          paramName: 'authCode',
          paramValue: authCode,
          paramType: typeof authCode,
        },
        {
          paramName: 'action',
          paramValue: action,
          paramType: typeof action,
        },
      ],
      additionalMessage: 'Product status updated successfully',
      startLogId,
    });

    return {
      message: 'Product status updated successfully',
      status: 200,
    };
  } catch (err) {
    if (token) {
      const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'productQttUpdateStatus',
        functionParams: [
          {
            paramName: 'productQttId',
            paramValue: productQttId,
            paramType: typeof productQttId,
          },
          {
            paramName: 'authCode',
            paramValue: authCode,
            paramType: typeof authCode,
          },
          {
            paramName: 'action',
            paramValue: action,
            paramType: typeof action,
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
    }

    return {
      message: err.message,
      status: 500,
    };
  }
}
