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
import StripeAccount from '../../../../MongoModels/StripeAccount';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function updateStripeAccount(parent, { stripeAccountData }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            if (context.token !== ENV_VALUES.BACKEND_API_KEY) {
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'updateStripeAccount',
                functionParams: [
                    {
                        paramName: 'stripeAccountData',
                        paramValue: stripeAccountData,
                        paramType: typeof stripeAccountData,
                    },
                ],
            });
            const { userId } = stripeAccountData;
            yield StripeAccount.findOneAndUpdate({
                userId,
            }, {
                $set: Object.assign({}, stripeAccountData),
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'updateStripeAccount',
                functionParams: [
                    {
                        paramName: 'stripeAccountData',
                        paramValue: stripeAccountData,
                        paramType: typeof stripeAccountData,
                    },
                ],
                additionalMessage: 'Stripe Account Updated Successfully',
                startLogId,
            });
            return {
                message: 'Stripe Account Updated Successfully',
                status: 200,
            };
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err._message) === 'StripeAccount validation failed') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'updateStripeAccount',
                    functionParams: [
                        {
                            paramName: 'stripeAccountData',
                            paramValue: stripeAccountData,
                            paramType: typeof stripeAccountData,
                        },
                    ],
                    additionalMessage: 'Mongoose StripeAccount Validation Failed',
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
                functionName: 'updateStripeAccount',
                functionParams: [
                    {
                        paramName: 'stripeAccountData',
                        paramValue: stripeAccountData,
                        paramType: typeof stripeAccountData,
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
//# sourceMappingURL=updateStripeAccount.js.map