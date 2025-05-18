var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import Service from '../../../../MongoModels/Service';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function leaveOrganization(parent, { token, organizationId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'leaveOrganization',
                functionParams: [
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
            const userInOrg = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
            });
            if (!userInOrg) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'leaveOrganization',
                    functionParams: [
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
                    additionalMessage: 'User already a member of this Organization',
                    startLogId,
                });
                return {
                    message: 'You are not a Member of this Organization',
                    status: 401,
                };
            }
            const isOwner = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId,
                role: 'owner',
            });
            if (isOwner) {
                const ownerCount = yield OrganizationMembership.count({
                    organizationId,
                    role: 'owner',
                }).exec();
                if (ownerCount <= 1) {
                    yield createApiLog({
                        type: ApiLogTypes.MUTATION_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'leaveOrganization',
                        functionParams: [
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
                        additionalMessage: 'You must promote another Owner before leaving the Organization',
                        startLogId,
                    });
                    return {
                        message: 'You must promote another Owner before leaving the Organization',
                        status: 400,
                    };
                }
            }
            const deletedMembership = yield OrganizationMembership.findOneAndDelete({
                userId: decodedToken.UserId,
                organizationId,
            })
                .orFail(() => new Error('Organization Membership Document Not Found'))
                .exec();
            const updatedOrganization = yield Organization.findByIdAndUpdate(organizationId, {
                $pull: {
                    members: deletedMembership.userId,
                },
            })
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            const deletedServices = yield Service.deleteMany({
                _id: deletedMembership.userId,
                organizationId,
            }).exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'leaveOrganization',
                functionParams: [
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
                additionalMessage: 'User left Organization Successfully',
                startLogId,
            });
            return {
                message: 'User Left Organization Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'leaveOrganization',
                    functionParams: [
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
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'leaveOrganization',
                functionParams: [
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
//# sourceMappingURL=leaveOrganization.js.map