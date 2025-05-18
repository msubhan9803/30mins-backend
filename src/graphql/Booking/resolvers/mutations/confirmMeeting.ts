import dayjs from 'dayjs';
import {LANGUAGES, PAYMENT_STATUS} from '../../../../constants/enums';
import agenda from '../../../../lib/agenda';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';

import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import {PAYMENT_TYPES} from '../../../../constants/enums';

export default async function confirmMeeting(parent, {documentId, chargeID}, context, info) {
  let startLogId: String;
  const {token} = context;
  try {
    const SECRETS = await AwsSecrets.getInstance();
    if (token !== SECRETS.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'confirmMeeting',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Invalid Permissions: Invalid API Key',
      });

      return {
        response: {
          message: 'Not Authenticated',
          status: 401,
        },
      };
    }

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'confirmMeeting',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
    });

    let booking = await BookedMeeting.findOneAndUpdate(
      {_id: documentId, chargeID: {$eq: chargeID}},
      {
        $set: {
          confirmed: true,
          paymentStatus: PAYMENT_STATUS.PAID,
        },
      },
      {returnOriginal: true, lean: true}
    );

    if (!booking) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'confirmMeeting',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Booking Not Found',
      });

      return {
        response: {
          message: 'Booking Not Found',
          status: 404,
        },
      };
    }
    const providerUser = await User.findById(booking.provider);
    const serviceData = await Service.findById(booking.serviceID);

    if (!booking.confirmed) {
      const ccRecipients = booking.ccRecipients.map(async function (email) {
        return {
          ccEmail: email,
          language: booking.bookerUser?.personalDetails?.language || LANGUAGES.ENGLISH,
        };
      });

      if (booking.price > 0 && booking.charity && booking.percentDonated) {
        const donationAmount = booking.price * (booking.percentDonated / 100);
        await sendEmail(
          {
            bookingId: booking._id,
            providerName: booking.providerName,
            donationAmount,
            currency: booking.currency,
            charity: booking.charity,
          },
          SECRETS.ESCROW_30MIN_EMAIL,
          TEMPLATES.POST_BOOKING.CHARITY_ALERT
        );
      }
    }

    if (
      !booking.confirmed &&
      !booking.status.paymentReleased &&
      booking.paymentType === PAYMENT_TYPES.DIRECT
    ) {
      await BookedMeeting.findByIdAndUpdate(documentId, {
        $set: {
          'status.paymentReleased': true,
        },
      });
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'confirmMeeting',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
      additionalMessage: 'Booking Confirmed',
      startLogId,
    });

    return {
      bookingData: booking,
      providerUser,
      serviceData,
      response: {
        message: 'Booking Confirmed',
        status: 200,
      },
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'confirmMeeting',
      functionParams: [
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
      response: {message: err.message, status: 500},
    };
  }
}
