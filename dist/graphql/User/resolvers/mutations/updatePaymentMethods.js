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
import jwt from 'jsonwebtoken';
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';
export default function updatePaymentMethods(parent, { direct, escrow }, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        let startLogId = '';
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let decodedToken;
        let userId = '';
        let functionParams = [];
        try {
            decodedToken = jwt.verify(token, accessTokenSecret);
            userId = decodedToken.UserId;
            functionParams = [
                { paramName: 'direct', paramValue: direct, paramType: typeof direct },
                { paramName: 'escrow', paramValue: escrow, paramType: typeof escrow },
                {
                    paramName: 'userId',
                    paramValue: userId,
                    paramType: typeof userId,
                },
            ];
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'updatePaymentMethods',
                functionParams: functionParams,
            });
            const filteredEscrow = escrow === null || escrow === void 0 ? void 0 : escrow.filter(el => !!el);
            const filteredDirect = direct === null || direct === void 0 ? void 0 : direct.filter(el => !!el);
            console.log(filteredEscrow);
            if (!(filteredEscrow === null || filteredEscrow === void 0 ? void 0 : filteredEscrow.length) || filteredEscrow.includes('none')) {
                yield Service.updateMany({ userId, paymentType: 'escrow' }, { $set: { paymentType: 'manual' } });
            }
            if (!(filteredDirect === null || filteredDirect === void 0 ? void 0 : filteredDirect.length) || filteredDirect.includes('none')) {
                yield Service.updateMany({ userId, paymentType: 'direct' }, { $set: { paymentType: 'manual' } });
            }
            yield User.findByIdAndUpdate(userId, {
                $set: {
                    'accountDetails.paymentAccounts.escrow': filteredEscrow,
                    'accountDetails.paymentAccounts.direct': filteredDirect,
                },
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'updatePaymentMethods',
                functionParams: functionParams,
                additionalMessage: `Updated Payment Methods Successfully`,
                startLogId,
            });
            return {
                message: 'Updated Payment Methods Successfully',
                status: 200,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'updatePaymentMethods',
                functionParams,
                additionalMessage: err.message,
                startLogId,
            });
            console.log(err.message);
            return {
                message: 'Unknown Error',
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=updatePaymentMethods.js.map