var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Service from '../../../../MongoModels/Service';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function deleteRoundRobinTeam(parent, { documentId, organizationId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        const { token } = context;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'deleteRoundRobinTeam',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
            const hasDeletePermission = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
                role: { $in: ['owner', 'admin'] },
            });
            if (!hasDeletePermission) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteRoundRobinTeam',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
                    additionalMessage: 'Not Authenticated:  The user does not have the delete permission',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated: The user does not have the delete permission',
                    status: 401,
                };
            }
            const services = yield Service.find({ roundRobinTeam: documentId }, ['_id']);
            yield Promise.all(services.map(s => {
                return Service.findByIdAndUpdate({ _id: s._id }, {
                    $set: {
                        isPrivate: true,
                        roundRobinTeam: null,
                    },
                });
            }));
            const deletedRoundRobin = yield RoundRobinTeam.findByIdAndDelete(documentId);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'deleteRoundRobinTeam',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
                additionalMessage: 'Deleted Round Robin Team Successfully',
                startLogId,
            });
            return {
                message: 'Deleted Round Robin Team Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deleteRoundRobinTeam',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'deleteRoundRobinTeam',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
//# sourceMappingURL=deleteRoundRobinTeam.js.map