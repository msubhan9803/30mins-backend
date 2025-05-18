var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import JobHistory from '../../../../MongoModels/JobHistory';
import User from '../../../../MongoModels/User';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function createJobHistory(parent, { jobHistoryData, token }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createJobHistory',
                functionParams: [
                    {
                        paramName: 'jobHistoryData',
                        paramValue: jobHistoryData,
                        paramType: typeof jobHistoryData,
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
            const { position, company, startDate, endDate, current, roleDescription, employmentType, location, } = jobHistoryData;
            const createdJobHistory = yield JobHistory.create({
                userId: decodedToken.UserId,
                position,
                company,
                startDate,
                endDate,
                current,
                roleDescription,
                employmentType,
                location,
            });
            const updatedUser = yield User.findByIdAndUpdate(decodedToken.UserId, {
                $push: {
                    jobHistory: createdJobHistory._id,
                },
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createJobHistory',
                functionParams: [
                    {
                        paramName: 'jobHistoryData',
                        paramValue: jobHistoryData,
                        paramType: typeof jobHistoryData,
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
                additionalMessage: 'Job History Created Successfully',
                startLogId,
            });
            return {
                message: 'Job History Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createJobHistory',
                    functionParams: [
                        {
                            paramName: 'jobHistoryData',
                            paramValue: jobHistoryData,
                            paramType: typeof jobHistoryData,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'JobHistory validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'createJobHistory',
                    functionParams: [
                        {
                            paramName: 'jobHistoryData',
                            paramValue: jobHistoryData,
                            paramType: typeof jobHistoryData,
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
                    additionalMessage: 'Mongoose JobHistory Validation Failed',
                    startLogId,
                });
                return {
                    message: err.message,
                    status: 400,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createJobHistory',
                functionParams: [
                    {
                        paramName: 'jobHistoryData',
                        paramValue: jobHistoryData,
                        paramType: typeof jobHistoryData,
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
//# sourceMappingURL=createJobHistory.js.map