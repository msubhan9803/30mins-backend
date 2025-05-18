import {languageCode} from './../../../../utils/languageCode';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import User from '../../../../MongoModels/User';
import {LANGUAGES} from '../../../../constants/enums';

export default async function createMessage(parent, {messageData}, context, info) {
  let startLogId: String;

  try {
    const {name, email, providerEmail, providerName, subject, phone, description} = messageData;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createMessage',
      functionParams: [
        {
          paramName: 'name',
          paramValue: name,
          paramType: typeof name,
        },
        {
          paramName: 'email',
          paramValue: email,
          paramType: typeof email,
        },
        {
          paramName: 'providerEmail',
          paramValue: providerEmail,
          paramType: typeof providerEmail,
        },
        {
          paramName: 'providerName',
          paramValue: providerName,
          paramType: typeof providerName,
        },

        {
          paramName: 'subject',
          paramValue: subject,
          paramType: typeof subject,
        },
        {
          paramName: 'phone',
          paramValue: phone,
          paramType: typeof phone,
        },
        {
          paramName: 'description',
          paramValue: description,
          paramType: typeof description,
        },
      ],
    });

    if (providerEmail) {
      const providerUser = await User.findOne({'accountDetails.email': providerEmail}, [
        'personalDetails.language',
      ]);
      await sendEmail(
        {
          subject,
          email,
          phone,
          name,
          providerName,
          description,
          [languageCode(providerUser?.personalDetails?.language || LANGUAGES.ENGLISH)]: true,
        },
        providerEmail,
        TEMPLATES.SEND_MESSAGE_EXTENSION
      );
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createMessage',
      functionParams: [
        {
          paramName: 'messageData',
          paramValue: messageData,
          paramType: typeof messageData,
        },
      ],
      additionalMessage: 'Message Successfully Sent',
      startLogId,
    });

    return {
      message: 'Message Successfully Sent',
      status: 200,
    };
  } catch (err) {
    if (err?._message === 'Service validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createMessage',
        functionParams: [
          {
            paramName: 'messageData',
            paramValue: messageData,
            paramType: typeof messageData,
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
      functionName: 'createMessage',
      functionParams: [
        {
          paramName: 'messageData',
          paramValue: messageData,
          paramType: typeof messageData,
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
