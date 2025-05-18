import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getlastWarningSent(_, {email}) {
  let startLogId: String;

  try {
    const user = await User.findOne({'accountDetails.email': email})
      .orFail(() => new Error('Document Not Found'))
      .exec();

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getlastWarningSent',
      functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
    });

    if (!user) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getlastWarningSent',
        functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
        additionalMessage: 'User Not Found',
        startLogId,
      });

      return {
        userData: null,
        response: {
          message: 'User Not Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getlastWarningSent',
      functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
      additionalMessage: 'Query Successful',
      startLogId,
    });

    if (!user?.lastWarningSent) {
      await User.findOneAndUpdate(
        {'accountDetails.email': email},
        {
          lastWarningSent: Date(),
        }
      );

      return {
        sendEmail: true,
        response: {
          message: 'Query Successful',
          status: 200,
        },
      };
    }
    const date1 = new Date(user?.lastWarningSent);
    const date2 = new Date();
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 1) {
      await User.findOneAndUpdate(
        {'accountDetails.email': email},
        {
          lastWarningSent: Date(),
        }
      );

      return {
        sendEmail: true,
        response: {
          message: 'Query Successful',
          status: 200,
        },
      };
    }

    return {
      sendEmail: false,
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
        functionName: 'getlastWarningSent',
        functionParams: [{paramName: 'email', paramValue: email, paramType: typeof email}],
        additionalMessage: 'Document Not Found',
        startLogId,
      });

      return {
        sendEmail: false,
        response: {
          message: 'Document Not Found',
          status: 401,
        },
      };
    }

    return {
      sendEmail: false,
      response: {
        message: err.message,
        status: 500,
      },
    };
  }
}
