var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Charity from '../../../../MongoModels/Charity';
export default function getServiceCharity(parent, { charityQuery }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const charities = yield Charity.find({ name: new RegExp(charityQuery, 'i') }).limit(10);
            return {
                charities,
                message: 'Slug Checked Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            if ((err === null || err === void 0 ? void 0 : err._message) === 'Charity validation failed') {
                return {
                    message: err.message,
                    status: 400,
                };
            }
            return {
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=getServiceCharity.js.map