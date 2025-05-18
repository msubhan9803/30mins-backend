var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import CollectiveGroup from '../../../../MongoModels/CollectiveGroup';
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { GROUP_LIMIT } from '../../../../constants/variables';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
export default function createGroup(parent, { groupData }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        const { token } = context;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createGroup',
                functionParams: [
                    {
                        paramName: 'groupData',
                        paramValue: groupData,
                        paramType: typeof groupData,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            const hasExtension = yield ActiveExtension.exists({
                userId: decodedToken.UserId,
                extensionProductId: stripeProductIDs.EXTENSIONS.COLLECTIVE_AVAILABILITY,
                status: {
                    $in: ['paid', 'gifted'],
                },
            });
            if (!hasExtension) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createGroup',
                    functionParams: [
                        {
                            paramName: 'groupData',
                            paramValue: groupData,
                            paramType: typeof groupData,
                        },
                    ],
                    additionalMessage: 'User does not have COLLECTIVE_AVAILABILITY Extension',
                    startLogId,
                });
                return {
                    message: 'User does not have COLLECTIVE AVAILABILITY Extension',
                    status: 400,
                };
            }
            let { guestIDs } = groupData;
            guestIDs = [...guestIDs];
            guestIDs = Array.from(new Set(guestIDs));
            if (guestIDs.length > GROUP_LIMIT) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createGroup',
                    functionParams: [
                        {
                            paramName: 'groupData',
                            paramValue: groupData,
                            paramType: typeof groupData,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Number Of Group Members Exceeding Limit',
                    startLogId,
                });
                return {
                    message: `Collective Group Contains More Than ${GROUP_LIMIT} User`,
                    status: 400,
                };
            }
            const name = `Group# ${guestIDs.length}`;
            const createdGroup = yield CollectiveGroup.create({
                name,
                ownerID: decodedToken.UserId,
                guestIDs,
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createGroup',
                functionParams: [
                    {
                        paramName: 'groupData',
                        paramValue: groupData,
                        paramType: typeof groupData,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
                additionalMessage: 'Group Created Successfully',
                startLogId,
            });
            return {
                message: 'Group Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createGroup',
                    functionParams: [
                        {
                            paramName: 'groupData',
                            paramValue: groupData,
                            paramType: typeof groupData,
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
            if ((err === null || err === void 0 ? void 0 : err._message) === 'CollectiveGroup validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createGroup',
                    functionParams: [
                        {
                            paramName: 'groupData',
                            paramValue: groupData,
                            paramType: typeof groupData,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Mongoose CollectiveGroup Validation Failed',
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
                functionName: 'createGroup',
                functionParams: [
                    {
                        paramName: 'groupData',
                        paramValue: groupData,
                        paramType: typeof groupData,
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
//# sourceMappingURL=createGroup.js.map