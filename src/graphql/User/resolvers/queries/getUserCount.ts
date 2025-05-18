import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';

export default async function getUsersCount(parent, { token }, context, info) {
    let startLogId: String;
    try {
        startLogId = await createApiLog({
            type: ApiLogTypes.QUERY_START,
            level: ApiLogLevels.INFO,
            functionName: 'getUsersCount',
            functionParams: [

                {
                    paramName: 'token',
                    paramValue: 'HIDDEN_TOKEN',
                    paramType: typeof token,
                }

            ],
        });

        const userCount = await User.count().exec();
        const userwelcomeCount = await User.find({
            welcomeComplete: true,
        }).count().exec();
        
        return {
            usercount: userCount ,
            welcomeData:userwelcomeCount,
            response: {
                message: 'Query Successful',
                status: 200,
            },
        };
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            await createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getUsersCount',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                ],
                additionalMessage: 'Invalid Permissions: JWT Token Invalid',
                startLogId,
            });
            return {
                response: {
                    message: 'Not Authenticated',
                    status: 401,
                },
            };
        }

        await createApiLog({
            type: ApiLogTypes.QUERY_END,
            level: ApiLogLevels.ERROR,
            functionName: 'getUsersCount',
            functionParams: [

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
            response: { message: err.message, status: 500 },
        };
    }
}
