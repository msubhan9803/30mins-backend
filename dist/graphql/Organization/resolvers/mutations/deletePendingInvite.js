var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function deletePendingInvite(parent, { token, documentId, organizationId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'deletePendingInvite',
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
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                ],
            });
            const hasPermissions = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId,
                role: { $in: ['admin', 'owner'] },
            });
            if (!hasPermissions) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deletePendingInvite',
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
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: User Lacks Admin/Owner Permissions',
                    startLogId,
                });
                return {
                    message: 'Invalid Permissions: User Lacks Admin/Owner Permissions',
                    status: 401,
                };
            }
            const deletedInvite = yield PendingInvite.findByIdAndDelete(documentId).exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'deletePendingInvite',
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
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                ],
                additionalMessage: 'Deleted Invite Successfully',
                startLogId,
            });
            return {
                message: 'Deleted Invite Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'deletePendingInvite',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
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
                functionName: 'deletePendingInvite',
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
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
//# sourceMappingURL=deletePendingInvite.js.map