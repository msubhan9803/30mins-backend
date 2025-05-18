var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
import User from '../../../../MongoModels/User';
export default function editRoundRobinTeam(parent, { roundRobinTeamData, documentId }, context, info) {
    var e_1, _a;
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
                functionName: 'editRoundRobinTeam',
                functionParams: [
                    {
                        paramName: 'roundRobinTeamData',
                        paramValue: roundRobinTeamData,
                        paramType: typeof roundRobinTeamData,
                    },
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
            const { name, organizationId, teamMembers } = roundRobinTeamData;
            const hasEditPermission = yield OrganizationMembership.exists({
                userId: decodedToken.UserId,
                organizationId: organizationId,
                role: { $in: ['owner', 'admin'] },
            });
            if (!hasEditPermission) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editRoundRobinTeam',
                    functionParams: [
                        {
                            paramName: 'roundRobinTeamData',
                            paramValue: roundRobinTeamData,
                            paramType: typeof roundRobinTeamData,
                        },
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
                    additionalMessage: 'Not Authenticated: User does not have Edit Permissions',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated: User does not have Edit Permissions ',
                    status: 401,
                };
            }
            const emails = teamMembers.map(m => m.memberEmail);
            const userEmails = yield User.find({
                'accountDetails.email': { $in: emails },
            }, ['_id', 'accountDetails.email']);
            try {
                for (var userEmails_1 = __asyncValues(userEmails), userEmails_1_1; userEmails_1_1 = yield userEmails_1.next(), !userEmails_1_1.done;) {
                    const userEmail = userEmails_1_1.value;
                    const isMember = yield OrganizationMembership.exists({
                        userId: userEmail._id,
                        organizationId: organizationId,
                    });
                    if (!isMember) {
                        yield createApiLog({
                            type: ApiLogTypes.MUTATION_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'editRoundRobinTeam',
                            functionParams: [
                                {
                                    paramName: 'roundRobinTeamData',
                                    paramValue: roundRobinTeamData,
                                    paramType: typeof roundRobinTeamData,
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
                            additionalMessage: `The User ${userEmail === null || userEmail === void 0 ? void 0 : userEmail.accountDetails.email} is not the member of Organization.`,
                            startLogId,
                        });
                        return {
                            message: `The User ${userEmail === null || userEmail === void 0 ? void 0 : userEmail.accountDetails.email} is not the member of Organization.`,
                            status: 400,
                        };
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (userEmails_1_1 && !userEmails_1_1.done && (_a = userEmails_1.return)) yield _a.call(userEmails_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            const teamMembersWithId = userEmails.map(u => {
                const member = teamMembers.find(member => member.memberEmail === u.accountDetails.email);
                return {
                    priority: member.priority,
                    memberId: u._id,
                };
            });
            const updatedRoundRobin = yield RoundRobinTeam.findByIdAndUpdate(documentId, {
                $set: {
                    name,
                    organizationId,
                    teamMembers: teamMembersWithId,
                },
            }, { runValidators: true })
                .orFail(() => new Error('Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'editRoundRobinTeam',
                functionParams: [
                    {
                        paramName: 'roundRobinTeamData',
                        paramValue: roundRobinTeamData,
                        paramType: typeof roundRobinTeamData,
                    },
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
                additionalMessage: 'Updated RoundRobinTeam Successfully',
                startLogId,
            });
            return {
                message: 'Updated RoundRobinTeam Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editRoundRobinTeam',
                    functionParams: [
                        {
                            paramName: 'roundRobinTeamData',
                            paramValue: roundRobinTeamData,
                            paramType: typeof roundRobinTeamData,
                        },
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'RoundRobinTeam validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'editRoundRobinTeam',
                    functionParams: [
                        {
                            paramName: 'roundRobinTeamData',
                            paramValue: roundRobinTeamData,
                            paramType: typeof roundRobinTeamData,
                        },
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
                    additionalMessage: 'Mongoose RoundRobinTeam Validation Failed',
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
                functionName: 'editRoundRobinTeam',
                functionParams: [
                    {
                        paramName: 'roundRobinTeamData',
                        paramValue: roundRobinTeamData,
                        paramType: typeof roundRobinTeamData,
                    },
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
//# sourceMappingURL=editRoundRobinTeam.js.map