var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { languageCode } from './../../../../utils/languageCode';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
import User from '../../../../MongoModels/User';
import { LANGUAGES } from '../../../../constants/enums';
export default function createMessage(parent, { messageData }, context, info) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const { name, email, providerEmail, providerName, subject, phone, description } = messageData;
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'createMessage',
                functionParams: [
                    {
                        paramName: 'name',
                        paramValue: name,
                        paramType: typeof name,
                    },
                    {
                        paramName: 'email',
                        paramValue: email,
                        paramType: typeof email,
                    },
                    {
                        paramName: 'providerEmail',
                        paramValue: providerEmail,
                        paramType: typeof providerEmail,
                    },
                    {
                        paramName: 'providerName',
                        paramValue: providerName,
                        paramType: typeof providerName,
                    },
                    {
                        paramName: 'subject',
                        paramValue: subject,
                        paramType: typeof subject,
                    },
                    {
                        paramName: 'phone',
                        paramValue: phone,
                        paramType: typeof phone,
                    },
                    {
                        paramName: 'description',
                        paramValue: description,
                        paramType: typeof description,
                    },
                ],
            });
            if (providerEmail) {
                const providerUser = yield User.findOne({ 'accountDetails.email': providerEmail }, [
                    'personalDetails.language',
                ]);
                yield sendEmail({
                    subject,
                    email,
                    phone,
                    name,
                    providerName,
                    description,
                    [languageCode(((_a = providerUser === null || providerUser === void 0 ? void 0 : providerUser.personalDetails) === null || _a === void 0 ? void 0 : _a.language) || LANGUAGES.ENGLISH)]: true,
                }, providerEmail, TEMPLATES.SEND_MESSAGE_EXTENSION);
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'createMessage',
                functionParams: [
                    {
                        paramName: 'messageData',
                        paramValue: messageData,
                        paramType: typeof messageData,
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
                    functionName: 'createMessage',
                    functionParams: [
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
                functionName: 'createMessage',
                functionParams: [
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
//# sourceMappingURL=createMessage.js.map