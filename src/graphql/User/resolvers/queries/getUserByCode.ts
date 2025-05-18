import PendingInvite from '../../../../MongoModels/PendingInvite';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import decryptObject from '../../../../utils/encryption/decryptObject';
import AwsSecrets from '../../../../utils/getAwsSecrets';

export default async function getUserByCode(parent, {code}, context, info) {
  let startLogId: String;

  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserByCode',
        functionParams: [
          {
            paramName: 'code',
            paramValue: code,
            paramType: typeof code,
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
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getUserByCode',
      functionParams: [{paramName: 'code', paramValue: code, paramType: typeof code}],
    });

    const userObject = await User.findOne({couponCode: code}, ['accountDetails.email']).exec();
    let invite: any;
    let hasAccount = true;

    if (!userObject) {
      invite = await PendingInvite.findOne({couponCode: code}).exec();
      hasAccount = false;
    }

    if (!userObject && !invite) {
      throw new Error('Document Not Found');
    }

    const user = await decryptObject(userObject);

    const userEmail = user?.accountDetails?.email
      ? user?.accountDetails?.email
      : invite?.inviteeEmail;
    const emailDomain = userEmail.split('@')[1];
    const rangeMin = 8;
    const rangeMax = 16;
    const hiddenVal = '*'.repeat(Math.floor(Math.random() * (rangeMax - rangeMin) + rangeMin));
    const emailHint = `${userEmail[0]}${hiddenVal}@${emailDomain}`;

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getUserByCode',
      functionParams: [{paramName: 'code', paramValue: code, paramType: typeof code}],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    return {
      emailHint,
      hasAccount,
      response: {
        message: 'Query Successful',
        status: 200,
      },
    };
  } catch (err) {
    if (err.message === 'Document Not Found') {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getUserByCode',
        functionParams: [{paramName: 'code', paramValue: code, paramType: typeof code}],
        additionalMessage: err.message,
        startLogId,
      });

      return {
        response: {
          message: err.message,
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getUserByCode',
      functionParams: [{paramName: 'code', paramValue: code, paramType: typeof code}],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
