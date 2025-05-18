import sgMail from '@sendgrid/mail';
import createApiLog, {ApiLogLevels, ApiLogTypes} from './createApiLog';
import AwsSecrets from './getAwsSecrets';

export default async function sendEmail(
  templateData: any,
  sendToEmail: string,
  templateId: string,
  bcc?: string
) {
  let startLogId: String;
  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    startLogId = await createApiLog({
      type: ApiLogTypes.API_PROCESSING_START,
      level: ApiLogLevels.INFO,
      functionName: 'sendEmail',
      functionParams: [
        {paramName: 'templateData', paramValue: templateData, paramType: typeof templateData},
        {paramName: 'sendToEmail', paramValue: sendToEmail, paramType: typeof sendToEmail},
        {paramName: 'templateId', paramValue: templateId, paramType: typeof templateId},
      ],
    });

    const apiKey = ENV_VALUES.SEND_GRID_API_KEY ? ENV_VALUES.SEND_GRID_API_KEY : '';

    sgMail.setApiKey(apiKey);

    const payload = {
      to: sendToEmail,
      from: 'hello@30mins.com',
      dynamicTemplateData: templateData,
      templateId: templateId,
      bcc: ['emaillogs@30mins.com'],
    };

    if (bcc) {
      payload.bcc = [bcc];
    }

    await sgMail.send(payload);

    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.INFO,
      functionName: 'sendEmail',
      functionParams: [
        {paramName: 'templateData', paramValue: templateData, paramType: typeof templateData},
        {paramName: 'sendToEmail', paramValue: sendToEmail, paramType: typeof sendToEmail},
        {paramName: 'templateId', paramValue: templateId, paramType: typeof templateId},
      ],
      additionalMessage: 'sendEmail Resolved Successfully',
      startLogId,
    });
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.API_PROCESSING_END,
      level: ApiLogLevels.ERROR,
      functionName: 'sendEmail',
      functionParams: [
        {paramName: 'templateData', paramValue: templateData, paramType: typeof templateData},
        {paramName: 'sendToEmail', paramValue: sendToEmail, paramType: typeof sendToEmail},
        {paramName: 'templateId', paramValue: templateId, paramType: typeof templateId},
      ],
      additionalMessage: err.message,
      startLogId,
    });
    throw err;
  }
}
