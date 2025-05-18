import {LANGUAGES} from './../../../../constants/enums';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import User from '../../../../MongoModels/User';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {languageCode} from '../../../../utils/languageCode';

export default async function createHaveAnIdeaMessage(parent, {token, messageData}, context, info) {
  let startLogId: String;
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const {headline, description} = messageData;
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createHaveAnIdeaMessage',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'headline',
          paramValue: headline,
          paramType: typeof headline,
        },
        {
          paramName: 'description',
          paramValue: description,
          paramType: typeof description,
        },
      ],
    });

    const inviterUser = await User.findById(decodedToken.UserId).exec();

    await sendEmail(
      {
        inviterName: inviterUser.personalDetails.name,
        inviterEmail: inviterUser.accountDetails.email,
        headline,
        description,
        [languageCode(inviterUser?.personalDetails?.language || LANGUAGES.ENGLISH)]: true,
      },
      'ideas@30mins.com',
      TEMPLATES.HAVE_AN_IDEA
    );

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createHaveAnIdeaMessage',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'headline',
          paramValue: headline,
          paramType: typeof headline,
        },
        {
          paramName: 'description',
          paramValue: description,
          paramType: typeof description,
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
        functionName: 'createHaveAnIdeaMessage',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
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
      functionName: 'createHaveAnIdeaMessage',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
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
