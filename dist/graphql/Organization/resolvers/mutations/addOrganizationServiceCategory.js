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
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function addOrganizationServiceCategory(parent, { token, categoryData, organizationId }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'addOrganizationServiceCategory',
                functionParams: [
                    {
                        paramName: 'categoryData',
                        paramValue: categoryData,
                        paramType: typeof categoryData,
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
            const hasEditPermission = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
                role: { $in: ['owner', 'admin'] },
            });
            if (!hasEditPermission) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addOrganizationServiceCategory',
                    functionParams: [
                        {
                            paramName: 'categoryData',
                            paramValue: categoryData,
                            paramType: typeof categoryData,
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
                    additionalMessage: 'User not Admin or Owner of Organization',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const dupeCategory = yield Organization.exists({
                _id: organizationId,
                serviceCategories: categoryData,
            });
            if (dupeCategory) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addOrganizationServiceCategory',
                    functionParams: [
                        {
                            paramName: 'categoryData',
                            paramValue: categoryData,
                            paramType: typeof categoryData,
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
                    additionalMessage: 'Duplicate Category',
                    startLogId,
                });
                return {
                    message: 'This Category Already Exists',
                    status: 409,
                };
            }
            const updatedOrganization = yield Organization.findByIdAndUpdate(organizationId, {
                $push: {
                    serviceCategories: categoryData,
                },
            })
                .orFail(() => new Error('Organization Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'addOrganizationServiceCategory',
                functionParams: [
                    {
                        paramName: 'categoryData',
                        paramValue: categoryData,
                        paramType: typeof categoryData,
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
                additionalMessage: 'Organization Service Category Added Successfully',
                startLogId,
            });
            return {
                message: 'Organization Service Category Added Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'addOrganizationServiceCategory',
                    functionParams: [
                        {
                            paramName: 'categoryData',
                            paramValue: categoryData,
                            paramType: typeof categoryData,
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
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'addOrganizationServiceCategory',
                functionParams: [
                    {
                        paramName: 'categoryData',
                        paramValue: categoryData,
                        paramType: typeof categoryData,
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
//# sourceMappingURL=addOrganizationServiceCategory.js.map