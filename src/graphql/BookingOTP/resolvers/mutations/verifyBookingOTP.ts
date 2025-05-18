import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import bookingOTP from '../../../../MongoModels/BookingOTP';

export default async function verifyBookingOTP(
  parent,
  {email, serviceId, otpToken}: {email: string; serviceId: string; otpToken: string},
  context,
  info
) {
  const {token} = context;

  let startLogId: any;
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'verifyBookingOTP',
      functionParams: [
        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
        },
        {
          paramName: 'otpToken',
          paramValue: otpToken,
          paramType: typeof otpToken,
        },
        {paramName: 'serviceId', paramValue: serviceId, paramType: typeof serviceId},
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
    });

    email = email.trim().toLowerCase();
    otpToken = otpToken.trim().toLowerCase();
    const otpExist = await bookingOTP.exists({
      email,
      serviceId,
      otpToken,
    });
    if (!otpExist) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'verifyBookingOTP',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
          {
            paramName: 'otpToken',
            paramValue: otpToken,
            paramType: typeof otpToken,
          },
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Otp not found.',
        startLogId,
      });

      return {
        message: 'Otp not found.',
        status: 404,
      };
    }

    const bookingOtp = await bookingOTP.findOne({
      email,
      serviceId,
      otpToken,
    });
    bookingOtp.verified = true;
    await bookingOtp.save();

    await bookingOTP.deleteOne({
      email,
      serviceId,
      otpToken,
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'verifyBookingOTP',
      functionParams: [
        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
        },
        {
          paramName: 'otpToken',
          paramValue: otpToken,
          paramType: typeof otpToken,
        },
        {
          paramName: 'serviceId',
          paramValue: serviceId,
          paramType: typeof serviceId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
      ],
      additionalMessage: 'OTP verified Succesfully.',
      startLogId,
    });

    return {
      message: 'OTP verified Succesfully.',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'verifyBookingOTP',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
          {
            paramName: 'otpToken',
            paramValue: otpToken,
            paramType: typeof otpToken,
          },
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
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

    if (err?._message === 'BookingOTP validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'verifyBookingOTP',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
          },
          {
            paramName: 'otpToken',
            paramValue: otpToken,
            paramType: typeof otpToken,
          },
          {
            paramName: 'serviceId',
            paramValue: serviceId,
            paramType: typeof serviceId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: 'Mongoose Service Validation Failed',
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
      functionName: 'verifyBookingOTP',
      functionParams: [
        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
        },
        {
          paramName: 'otpToken',
          paramValue: otpToken,
          paramType: typeof otpToken,
        },
        {
          paramName: 'serviceId',
          paramValue: serviceId,
          paramType: typeof serviceId,
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
      message: err.message,
      status: 500,
    };
  }
}
