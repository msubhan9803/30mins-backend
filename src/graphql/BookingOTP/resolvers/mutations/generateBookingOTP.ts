import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

import bookingOTP from '../../../../MongoModels/BookingOTP';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';

export default async function generateBookingOTP(
  parent,
  {email, serviceId}: {email: string; serviceId: string},
  context,
  info
) {
  const {token} = context;
  let startLogId: any;
  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'generateBookingOTP',
      functionParams: [
        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
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
    });

    email = email.trim().toLowerCase();

    const otpExist = await bookingOTP.exists({
      email,
      serviceId,
    });
    if (otpExist) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'generateBookingOTP',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
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
        additionalMessage: 'Otp for this email and service already exist.',
        startLogId,
      });

      return {
        message: 'Otp for this email and service already exist.',
        status: 409,
      };
    }
    const otpToken = Math.floor(100000 + Math.random() * 900000);
    await bookingOTP.create({
      otpToken,
      email,
      serviceId,
    });

    await sendEmail(
      {
        otpToken,
      },
      email,
      TEMPLATES.SIGN_IN.OTP_VERIFICATION,
      'signups@30mins.com'
    );
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'generateBookingOTP',
      functionParams: [
        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
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
      additionalMessage: 'OTP generated Succesfully.',
      startLogId,
    });

    return {
      message: 'OTP generated Succesfully.',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'generateBookingOTP',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
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
        functionName: 'generateBookingOTP',
        functionParams: [
          {
            paramName: 'email',
            paramValue: email,
            paramType: typeof email,
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
      functionName: 'generateBookingOTP',
      functionParams: [
        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
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
