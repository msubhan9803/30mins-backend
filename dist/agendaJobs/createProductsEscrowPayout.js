var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../utils/createApiLog';
import PendingPayout from '../MongoModels/PendingPayout';
export default function createProductsEscrowPayout(agenda) {
    return __awaiter(this, void 0, void 0, function* () {
        agenda.define('createProductsEscrowPayout', (job, done) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { payoutData } = job.attrs.data;
                yield createApiLog({
                    type: ApiLogTypes.API_PROCESSING_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'createProductsEscrowPayout',
                    functionParams: [
                        {
                            paramName: 'payoutData',
                            paramValue: payoutData,
                            paramType: typeof payoutData,
                        },
                    ],
                    additionalMessage: JSON.stringify(job.attrs.data),
                    startLogId: ``,
                });
                const pendingPayout = yield PendingPayout.create(payoutData);
                yield pendingPayout.save();
                yield job.remove();
                done();
            }
            catch (err) {
                yield createApiLog({
                    type: ApiLogTypes.API_PROCESSING_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'createProductsEscrowPayout',
                    functionParams: [],
                    additionalMessage: err.message,
                    startLogId: ``,
                });
                throw err;
            }
        }));
    });
}
//# sourceMappingURL=createProductsEscrowPayout.js.map