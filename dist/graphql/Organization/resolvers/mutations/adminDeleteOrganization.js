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
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import PendingInvite from '../../../../MongoModels/PendingInvite';
import PendingJoinRequest from '../../../../MongoModels/PendingJoinRequest';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
export default function adminDeleteOrganization(parent, { documentId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        let decodedToken;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
            decodedToken = jwt.verify(context.token, accessTokenSecret);
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'adminDeleteOrganization',
                functionParams: [
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
                response: { message: 'Not Authorized', status: 401 },
            };
        }
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'adminDeleteOrganization',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const isAdminUser = yield User.exists({
                _id: decodedToken.UserId,
                'accountDetails.accountType': 'admin',
            });
            if (!isAdminUser) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'adminDeleteOrganization',
                    functionParams: [
                        {
                            paramName: 'documentId',
                            paramValue: documentId,
                            paramType: typeof documentId,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Not Authenticated: User Lacks Admin Permissions',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const deletedOrganization = yield Organization.findByIdAndDelete(documentId)
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            yield OrganizationMembership.deleteMany({ organizationId: deletedOrganization._id }).exec();
            yield PendingInvite.deleteMany({ organizationId: deletedOrganization._id }).exec();
            yield PendingJoinRequest.deleteMany({ organizationId: deletedOrganization._id }).exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'adminDeleteOrganization',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Organization Deleted Successfully',
                startLogId,
            });
            return {
                message: 'Organization Deleted Successfully',
                status: 200,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'adminDeleteOrganization',
                functionParams: [
                    {
                        paramName: 'documentId',
                        paramValue: documentId,
                        paramType: typeof documentId,
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
//# sourceMappingURL=adminDeleteOrganization.js.map