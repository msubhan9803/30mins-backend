var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import { BW_LIST } from '../../../../constants/enums';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import Service from '../../../../MongoModels/Service';
export default function checkEmailFilter(parent, { serviceID, bookerEmail, providerID }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const SECRETS = yield AwsSecrets.getInstance();
            if (context.token !== SECRETS.BACKEND_API_KEY) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkEmailFilter',
                    functionParams: [
                        {
                            paramName: 'serviceID',
                            paramValue: serviceID,
                            paramType: typeof serviceID,
                        },
                        {
                            paramName: 'bookerEmail',
                            paramValue: 'bookerEmail',
                            paramType: typeof bookerEmail,
                        },
                        {
                            paramName: 'providerID',
                            paramValue: 'providerID',
                            paramType: typeof providerID,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid API Key',
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'checkEmailFilter',
                functionParams: [
                    {
                        paramName: 'serviceID',
                        paramValue: serviceID,
                        paramType: typeof serviceID,
                    },
                    {
                        paramName: 'bookerEmail',
                        paramValue: 'bookerEmail',
                        paramType: typeof bookerEmail,
                    },
                    {
                        paramName: 'providerID',
                        paramValue: 'providerID',
                        paramType: typeof providerID,
                    },
                ],
            });
            const hasExtension = yield ActiveExtension.exists({
                userId: providerID,
                extensionProductId: stripeProductIDs.EXTENSIONS.BLACK_WHITE_LIST,
                status: {
                    $in: ['paid', 'gifted'],
                },
            });
            if (hasExtension) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'checkEmailFilter',
                    functionParams: [
                        {
                            paramName: 'serviceID',
                            paramValue: serviceID,
                            paramType: typeof serviceID,
                        },
                        {
                            paramName: 'bookerEmail',
                            paramValue: 'bookerEmail',
                            paramType: typeof bookerEmail,
                        },
                        {
                            paramName: 'providerID',
                            paramValue: 'providerID',
                            paramType: typeof providerID,
                        },
                    ],
                    additionalMessage: 'Provider has BLACK_WHITE_LIST Extension',
                    startLogId,
                });
                const serviceEmailFilter = yield Service.findOne({
                    _id: serviceID,
                }, ['emailFilter']).orFail(() => new Error('Service Document Not Found'));
                if (serviceEmailFilter === null || serviceEmailFilter === void 0 ? void 0 : serviceEmailFilter.emailFilter) {
                    const emailFiltered = serviceEmailFilter.emailFilter.emails.includes(bookerEmail);
                    const domainFiltered = serviceEmailFilter.emailFilter.domains.some(val => bookerEmail.split('@').includes(val));
                    if (serviceEmailFilter.emailFilter.type === BW_LIST.BLACK_LIST &&
                        (emailFiltered || domainFiltered)) {
                        yield createApiLog({
                            type: ApiLogTypes.QUERY_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'checkEmailFilter',
                            functionParams: [
                                {
                                    paramName: 'serviceID',
                                    paramValue: serviceID,
                                    paramType: typeof serviceID,
                                },
                                {
                                    paramName: 'bookerEmail',
                                    paramValue: 'bookerEmail',
                                    paramType: typeof bookerEmail,
                                },
                                {
                                    paramName: 'providerID',
                                    paramValue: 'providerID',
                                    paramType: typeof providerID,
                                },
                            ],
                            additionalMessage: `This ${emailFiltered ? 'email' : 'domain'} is Blocked by the Provider user.`,
                            startLogId,
                        });
                        return {
                            message: `This ${emailFiltered ? 'email' : 'domain'} is Blocked by the Provider user.`,
                            status: 401,
                        };
                    }
                    else if (serviceEmailFilter.emailFilter.type === BW_LIST.WHITE_LIST &&
                        !emailFiltered &&
                        !domainFiltered) {
                        yield createApiLog({
                            type: ApiLogTypes.QUERY_END,
                            level: ApiLogLevels.ERROR,
                            functionName: 'checkEmailFilter',
                            functionParams: [
                                {
                                    paramName: 'serviceID',
                                    paramValue: serviceID,
                                    paramType: typeof serviceID,
                                },
                                {
                                    paramName: 'bookerEmail',
                                    paramValue: 'bookerEmail',
                                    paramType: typeof bookerEmail,
                                },
                                {
                                    paramName: 'providerID',
                                    paramValue: 'providerID',
                                    paramType: typeof providerID,
                                },
                            ],
                            additionalMessage: `This ${!emailFiltered ? 'email' : 'domain'} is not in the whitelist.`,
                            startLogId,
                        });
                        return {
                            message: `This ${!emailFiltered ? 'email' : 'domain'} is not in the whitelist.`,
                            status: 401,
                        };
                    }
                }
            }
            return {
                message: 'Email Validation Passed',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkEmailFilter',
                    functionParams: [
                        {
                            paramName: 'serviceID',
                            paramValue: serviceID,
                            paramType: typeof serviceID,
                        },
                        {
                            paramName: 'bookerEmail',
                            paramValue: 'bookerEmail',
                            paramType: typeof bookerEmail,
                        },
                        {
                            paramName: 'providerID',
                            paramValue: 'providerID',
                            paramType: typeof providerID,
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
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'checkEmailFilter',
                functionParams: [
                    {
                        paramName: 'serviceID',
                        paramValue: serviceID,
                        paramType: typeof serviceID,
                    },
                    {
                        paramName: 'bookerEmail',
                        paramValue: 'bookerEmail',
                        paramType: typeof bookerEmail,
                    },
                    {
                        paramName: 'providerID',
                        paramValue: 'providerID',
                        paramType: typeof providerID,
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
//# sourceMappingURL=checkEmailFilter.js.map