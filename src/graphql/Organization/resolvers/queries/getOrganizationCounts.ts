import Organization from '../../../../MongoModels/Organization';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';

export default async function getOrganizationCounts(parent, { token }, context, info) {
    let startLogId: String;
    try {
        startLogId = await createApiLog({
            type: ApiLogTypes.QUERY_START,
            level: ApiLogLevels.INFO,
            functionName: 'getOrganizationCounts',
            functionParams: [

                {
                    paramName: 'token',
                    paramValue: 'HIDDEN_TOKEN',
                    paramType: typeof token,
                }

            ],
        });
        const OrganizationCount = await Organization.count().exec();
        return {
            OrganizationCount: OrganizationCount,
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
                functionName: 'getOrganizationCounts',
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
            functionName: 'getOrganizationCounts',
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
