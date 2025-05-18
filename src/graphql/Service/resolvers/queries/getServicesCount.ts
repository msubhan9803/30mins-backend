import Service from '../../../../MongoModels/Service';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';

export default async function getServiceCount(parent, { token }, context, info) {
    let startLogId: String;
    try {
        startLogId = await createApiLog({
            type: ApiLogTypes.QUERY_START,
            level: ApiLogLevels.INFO,
            functionName: 'getServiceCount',
            functionParams: [

                {
                    paramName: 'token',
                    paramValue: 'HIDDEN_TOKEN',
                    paramType: typeof token,
                }

            ],
        });
        const filterPaidData= await Service.find({isPaid:true}).count().exec();
        const filterFreedata= await Service.find({isPaid:false}).count().exec();
        return {
            servicePaidCount: filterPaidData,
            serviceFreeCount: filterFreedata,
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
                functionName: 'getServiceCount',
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
            functionName: 'getServiceCount',
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
