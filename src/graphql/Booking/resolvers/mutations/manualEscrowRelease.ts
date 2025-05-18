import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import PendingPayout from '../../../../MongoModels/PendingPayout';
import {EscrowReleaseStatus} from '../../../../constants/enums';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import BookedMeeting from '../../../../MongoModels/BookedMeeting';

export default async function manualEscrowRelease(parent, {documentId}, context) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String = '';

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'manualEscrowRelease',
      functionParams: [
        {
          paramName: 'operatorUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
      ],
    });

    const isAuthorized = await User.exists({
      _id: decodedToken.UserId,
      'accountDetails.accountType': {$in: ['admin', 'payoutOperator']},
    });

    if (!isAuthorized) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'manualEscrowRelease',
        functionParams: [
          {
            paramName: 'operatorUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
        ],
        additionalMessage: 'Not Authenticated: User Lacks Payout Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    const existingPayout = await PendingPayout.findByIdAndUpdate(documentId, {
      $set: {
        status: EscrowReleaseStatus.RELEASED,
        dateReleased: Date.now(),
      },
    }).orFail(() => new Error('Payout Document Not Found'));

    await BookedMeeting.findByIdAndUpdate(existingPayout.bookingId, {
      $set: {
        'status.paymentReleased': true,
      },
    });

    await sendEmail(
      {
        currency: '$',
        amountToRelease: existingPayout.amountToRelease,
      },
      existingPayout.providerEmail,
      TEMPLATES.POST_BOOKING.PAYMENT_RELEASED
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'manualEscrowRelease',
      functionParams: [
        {
          paramName: 'operatorUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
      ],
      additionalMessage: 'Payout Updated Successfully',
      startLogId,
    });

    return {
      message: 'Payout Updated Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'manualEscrowRelease',
        functionParams: [
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
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

    if (err?._message === 'Payout validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'manualEscrowRelease',
        functionParams: [
          {
            paramName: 'operatorUserId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
        ],
        additionalMessage: err.message,
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
      functionName: 'manualEscrowRelease',
      functionParams: [
        {
          paramName: 'operatorUserId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
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
