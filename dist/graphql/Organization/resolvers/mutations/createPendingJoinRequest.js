var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LANGUAGES } from '../../../../constants/enums';
import { languageCode } from '../../../../utils/languageCode';
import jwt from 'jsonwebtoken';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import PendingJoinRequest from '../../../../MongoModels/PendingJoinRequest';
import Organization from '../../../../MongoModels/Organization';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function createPendingJoinRequest(parent, { token, organizationId }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId = '';
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createPendingJoinRequest',
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
                        paramName: 'requesterUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const existingRequest = yield PendingJoinRequest.exists({
                requesterUserId: decodedToken.UserId,
                organizationId,
            });
            if (existingRequest) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingJoinRequest',
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
                            paramName: 'requesterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Pending Request already exists for this User',
                    startLogId,
                });
                return {
                    message: 'Pending Request already exists for this User',
                    status: 409,
                };
            }
            const requesterUser = yield User.findById(decodedToken.UserId)
                .orFail(() => new Error('User Document Not Found'))
                .exec();
            const organization = yield Organization.findById(organizationId)
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            const userInOrg = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId,
            });
            if (userInOrg) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingJoinRequest',
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
                            paramName: 'inviterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'User is already in this organization',
                    startLogId,
                });
                return {
                    message: 'User is already in this organization',
                    status: 400,
                };
            }
            const orgOwnerMembership = yield OrganizationMembership.findOne({
                organizationId,
                role: 'owner',
            })
                .populate('userId', [
                'accountDetails.email',
                'personalDetails.name',
                'personalDetails.language',
            ])
                .orFail(() => new Error('Organization Owner Document Not Found'))
                .exec();
            const orgOwnerUser = orgOwnerMembership.userId;
            const createdRequest = yield PendingJoinRequest.create({
                requesterUserId: requesterUser._id,
                organizationId,
            });
            yield sendEmail({
                organizationTitle: organization.title,
                ownerName: orgOwnerUser.personalDetails.name,
                organizationID: organizationId,
                requesterName: requesterUser.personalDetails.name,
                requesterUsername: requesterUser.accountDetails.username,
                requestID: createdRequest === null || createdRequest === void 0 ? void 0 : createdRequest._id,
                [languageCode(((_a = orgOwnerUser === null || orgOwnerUser === void 0 ? void 0 : orgOwnerUser.personalDetails) === null || _a === void 0 ? void 0 : _a.language) || LANGUAGES.ENGLISH)]: true,
            }, orgOwnerUser.accountDetails.email, TEMPLATES.ORGANIZATIONS.REQUEST_TO_OWNER);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createPendingJoinRequest',
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
                        paramName: 'requesterUserId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Created Request Successfully',
                startLogId,
            });
            return {
                message: 'Created Request Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingJoinRequest',
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'PendingJoinRequest validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createPendingJoinRequest',
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
                            paramName: 'requesterUserId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Mongoose PendingJoinRequest Validation Failed',
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
                functionName: 'createPendingJoinRequest',
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
                        paramName: 'requesterUserId',
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
//# sourceMappingURL=createPendingJoinRequest.js.map