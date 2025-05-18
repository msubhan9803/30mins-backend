import ActiveExtensions from '../../../../MongoModels/ActiveExtension';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import {AccessToken} from '../../../../constants/types';
import jwt from 'jsonwebtoken';

export default async function getExtensionsCounts(parent, { token }, context, info) {
    const SECRETS = await AwsSecrets.getInstance();
    const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
    let startLogId: String;
    try {    
        const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

        startLogId = await createApiLog({
            type: ApiLogTypes.QUERY_START,
            level: ApiLogLevels.INFO,
            functionName: 'getExtensionsCounts',
            functionParams: [

                {
                    paramName: 'token',
                    paramValue: 'HIDDEN_TOKEN',
                    paramType: typeof token,
                },
                {
                    paramName: 'userId',
                    paramValue: decodedToken.UserId,
                    paramType: typeof decodedToken.UserId,
                  },
            ],
        });
        const activeExtensions = await ActiveExtensions.count().exec();
        return {
            extensionCount: activeExtensions,
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
                functionName: 'getExtensionsCounts',
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
            functionName: 'getExtensionsCounts',
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
