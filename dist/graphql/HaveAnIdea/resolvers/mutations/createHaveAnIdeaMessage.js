var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LANGUAGES } from './../../../../constants/enums';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import jwt from 'jsonwebtoken';
import User from '../../../../MongoModels/User';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { languageCode } from '../../../../utils/languageCode';
export default function createHaveAnIdeaMessage(parent, { token, messageData }, context, info) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            const { headline, description } = messageData;
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createHaveAnIdeaMessage',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'headline',
                        paramValue: headline,
                        paramType: typeof headline,
                    },
                    {
                        paramName: 'description',
                        paramValue: description,
                        paramType: typeof description,
                    },
                ],
            });
            const inviterUser = yield User.findById(decodedToken.UserId).exec();
            yield sendEmail({
                inviterName: inviterUser.personalDetails.name,
                inviterEmail: inviterUser.accountDetails.email,
                headline,
                description,
                [languageCode(((_a = inviterUser === null || inviterUser === void 0 ? void 0 : inviterUser.personalDetails) === null || _a === void 0 ? void 0 : _a.language) || LANGUAGES.ENGLISH)]: true,
            }, 'ideas@30mins.com', TEMPLATES.HAVE_AN_IDEA);
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createHaveAnIdeaMessage',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'headline',
                        paramValue: headline,
                        paramType: typeof headline,
                    },
                    {
                        paramName: 'description',
                        paramValue: description,
                        paramType: typeof description,
                    },
                ],
                additionalMessage: 'Message Successfully Sent',
                startLogId,
            });
            return {
                message: 'Message Successfully Sent',
                status: 200,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Service validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createHaveAnIdeaMessage',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'messageData',
                            paramValue: messageData,
                            paramType: typeof messageData,
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
                functionName: 'createHaveAnIdeaMessage',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'messageData',
                        paramValue: messageData,
                        paramType: typeof messageData,
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
//# sourceMappingURL=createHaveAnIdeaMessage.js.map