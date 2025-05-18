import Agenda from 'agenda';
import sendEmail from '../utils/sendEmailHandler';
import TEMPLATES from '../constants/emailTemplateIDs';
import User from '../MongoModels/User';
import AwsSecrets from '../utils/getAwsSecrets';
import Stripe from 'stripe';
import BookedMeeting from '../MongoModels/BookedMeeting';
import {ESCROW_PAYMENT_OPTIONS, EscrowReleaseStatus} from '../constants/enums';
import PendingPayout from '../MongoModels/PendingPayout';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../utils/createApiLog';

export default async function sendEscrowReleaseEmail(agenda: Agenda) {
  let catchEmailData;
  let catchPaymentAccount;
  let startLogId;
  try {
    const SECRETS = await AwsSecrets.getInstance();
    agenda.define('sendEscrowReleaseEmail', async (job, done) => {
      const {emailData, paymentAccount, providerId} = job.attrs.data;
      catchEmailData = emailData;
      catchPaymentAccount = paymentAccount;
      startLogId = await createApiLog({
        type: ApiLogTypes.API_PROCESSING_START,
        level: ApiLogLevels.INFO,
        functionName: 'sendEscrowReleaseEmail',
        functionParams: [
          {
            paramName: 'emailData',
            paramValue: emailData,
            paramType: typeof emailData,
          },
          {
            paramName: 'paymentAccount',
            paramValue: paymentAccount,
            paramType: typeof paymentAccount,
          },
        ],
        additionalMessage: 'Escrow Release Start',
      });

      const provider = await User.findById(providerId);
      const providerPayoutType = provider?.accountDetails?.paymentAccounts?.escrow[0];
      const providerPayoutId = provider?.accountDetails[providerPayoutType];

      if (providerPayoutType === ESCROW_PAYMENT_OPTIONS.STRIPE) {
        const stripe = new Stripe(SECRETS.STRIPE_SERVER_ID_TEST!, {
          apiVersion: '2020-08-27',
        });

        const transfer = await stripe.transfers.create({
          amount: Math.ceil(emailData.amountToRelease * 100),
          currency: 'USD',
          destination: provider?.accountDetails?.stripeAccountId,
        });

        await BookedMeeting.findByIdAndUpdate(emailData.bookingId, {
          $set: {
            'status.paymentReleased': true,
          },
        });

        await sendEmail(
          {
            transferId: transfer.id,
            ...emailData,
          },
          SECRETS.ESCROW_30MIN_EMAIL,
          TEMPLATES.POST_BOOKING.RELEASE_ESCROW_TO_30MIN
        );

        await sendEmail(
          emailData,
          provider.accountDetails.email,
          TEMPLATES.POST_BOOKING.PAYMENT_RELEASED
        );

        await PendingPayout.create({
          providerEmail: provider?.accountDetails?.email,
          providerPayoutMethod: {
            payoutType: 'Stripe',
            payoutId: provider?.accountDetails?.stripeAccountId,
          },
          bookerEmail: emailData?.clientEmail,
          amountToRelease: emailData?.amountToRelease,
          bookingId: emailData.bookingId,
          status: EscrowReleaseStatus.RELEASED,
          dateReleased: Date.now(),
        });
      } else {
        await PendingPayout.create({
          providerEmail: provider?.accountDetails?.email,
          providerPayoutMethod: {
            payoutType: providerPayoutType,
            payoutId: providerPayoutId,
          },
          bookerEmail: emailData?.clientEmail,
          amountToRelease: emailData?.amountToRelease,
          bookingId: emailData?.bookingId,
          status: EscrowReleaseStatus.UNRELEASED,
        });
      }

      await sendEmail(
        {
          ...emailData,
        },
        SECRETS.ESCROW_30MIN_EMAIL,
        TEMPLATES.POST_BOOKING.RELEASE_ESCROW_TO_30MIN
      );

      await createApiLog({
        type: ApiLogTypes.API_PROCESSING_END,
        level: ApiLogLevels.INFO,
        functionName: 'sendEscrowReleaseEmail',
        functionParams: [
          {
            paramName: 'emailData',
            paramValue: emailData,
            paramType: typeof emailData,
          },
          {
            paramName: 'paymentAccount',
            paramValue: paymentAccount,
            paramType: typeof paymentAccount,
          },
        ],
        additionalMessage: 'Escrow Release End',
        startLogId,
      });

      await job.remove();
      done();
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.INFO,
      functionName: 'sendEscrowReleaseEmail',
      functionParams: [
        {
          paramName: 'catchEmailData',
          paramValue: catchEmailData,
          paramType: typeof catchEmailData,
        },
        {
          paramName: 'catchPaymentAccount',
          paramValue: catchPaymentAccount,
          paramType: typeof catchPaymentAccount,
        },
      ],
      additionalMessage: `Escrow Release Error: ${err?.message}`,
      startLogId,
    });
    throw err;
  }
}
