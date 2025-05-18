var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import RoundRobinTeam from './../../../../MongoModels/RoundRobinTeam';
import { SERVICE_TYPES } from './../../../../constants/enums';
import Service from '../../../../MongoModels/Service';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
export default function assignRoundRobinTeamToService(parent, { serviceId, roundRobinTeamId, organizationId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'assignRoundRobinTeamToService',
                functionParams: [
                    {
                        paramName: 'roundRobinTeamId',
                        paramValue: roundRobinTeamId,
                        paramType: typeof roundRobinTeamId,
                    },
                    {
                        paramName: 'serviceId',
                        paramValue: serviceId,
                        paramType: typeof serviceId,
                    },
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
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
            const hasPermission = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
                role: { $in: ['owner', 'admin'] },
            });
            if (!hasPermission) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'assignRoundRobinTeamToService',
                    functionParams: [
                        {
                            paramName: 'roundRobinTeamId',
                            paramValue: roundRobinTeamId,
                            paramType: typeof roundRobinTeamId,
                        },
                        {
                            paramName: 'serviceId',
                            paramValue: serviceId,
                            paramType: typeof serviceId,
                        },
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
                        },
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
                    additionalMessage: 'Not Authenticated:  The user does not have the assign permission',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated: The user does not have the assign permission',
                    status: 401,
                };
            }
            if (roundRobinTeamId) {
                const roundRobinExist = yield RoundRobinTeam.exists({
                    _id: roundRobinTeamId,
                    organizationId: organizationId,
                });
                if (!roundRobinExist) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_START,
                        level: ApiLogLevels.ERROR,
                        functionName: 'assignRoundRobinTeamToService',
                        functionParams: [
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
                            {
                                paramName: 'organizationId',
                                paramValue: organizationId,
                                paramType: typeof organizationId,
                            },
                            {
                                paramName: 'userId',
                                paramValue: decodedToken.UserId,
                                paramType: typeof decodedToken.UserId,
                            },
                        ],
                        additionalMessage: 'The round robin team does not exist',
                        startLogId,
                    });
                    return {
                        message: 'The round robin team does not exist',
                        status: 401,
                    };
                }
            }
            const serviceExist = yield Service.exists({
                _id: serviceId,
                organizationId: organizationId,
                serviceType: SERVICE_TYPES.ROUND_ROBIN,
                roundRobinTeam: { $in: [null, undefined] },
            });
            if (!serviceExist) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_START,
                    level: ApiLogLevels.ERROR,
                    functionName: 'assignRoundRobinTeamToService',
                    functionParams: [
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
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Invalid Service.',
                    startLogId,
                });
                return {
                    message: 'Invalid Service.',
                    status: 401,
                };
            }
            const updatedService = yield Service.findByIdAndUpdate({
                _id: serviceId,
            }, {
                $set: {
                    isPrivate: false,
                    roundRobinTeam: roundRobinTeamId,
                },
            }).orFail(() => new Error('Round Robin Organization Service Document Not Found'));
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'assignRoundRobinTeamToService',
                functionParams: [
                    {
                        paramName: 'roundRobinTeamId',
                        paramValue: roundRobinTeamId,
                        paramType: typeof roundRobinTeamId,
                    },
                    {
                        paramName: 'serviceId',
                        paramValue: serviceId,
                        paramType: typeof serviceId,
                    },
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
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
                additionalMessage: 'Round Robin Organization Service Assigned Team Successfully',
                startLogId,
            });
            return {
                message: 'Round Robin Organization Service Assigned Team Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'assignRoundRobinTeamToService',
                    functionParams: [
                        {
                            paramName: 'roundRobinTeamId',
                            paramValue: roundRobinTeamId,
                            paramType: typeof roundRobinTeamId,
                        },
                        {
                            paramName: 'serviceId',
                            paramValue: serviceId,
                            paramType: typeof serviceId,
                        },
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
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
            const decodedToken = jwt.verify(token, accessTokenSecret);
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Service validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'assignRoundRobinTeamToService',
                    functionParams: [
                        {
                            paramName: 'roundRobinTeamId',
                            paramValue: roundRobinTeamId,
                            paramType: typeof roundRobinTeamId,
                        },
                        {
                            paramName: 'serviceId',
                            paramValue: serviceId,
                            paramType: typeof serviceId,
                        },
                        {
                            paramName: 'organizationId',
                            paramValue: organizationId,
                            paramType: typeof organizationId,
                        },
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
                    additionalMessage: 'Mongoose Service Validation Failed',
                    startLogId,
                });
                return {
                    message: err.message,
                    status: 400,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'assignRoundRobinTeamToService',
                functionParams: [
                    {
                        paramName: 'roundRobinTeamId',
                        paramValue: roundRobinTeamId,
                        paramType: typeof roundRobinTeamId,
                    },
                    {
                        paramName: 'serviceId',
                        paramValue: serviceId,
                        paramType: typeof serviceId,
                    },
                    {
                        paramName: 'organizationId',
                        paramValue: organizationId,
                        paramType: typeof organizationId,
                    },
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
                additionalMessage: err.message,
                startLogId,
            });
            return {
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=assignRoundRobinTeamToService.js.map