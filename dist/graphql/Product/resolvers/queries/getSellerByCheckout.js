var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import ProductQtt from '../../../../MongoModels/ProductQtt';
import User from '../../../../MongoModels/User';
export default function getSellerByCheckout(_, { checkoutId }) {
    var _a, _b, _c, _d, _e, _f, _g;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const product = yield ProductQtt.findOne({ checkout: checkoutId }).populate('product');
            const user = yield User.findById(product.product.seller);
            return {
                response: {
                    message: 'Not Authenticated',
                    status: 401,
                },
                seller: {
                    accountDetails: {
                        username: (_a = user === null || user === void 0 ? void 0 : user.accountDetails) === null || _a === void 0 ? void 0 : _a.username,
                        email: (_b = user === null || user === void 0 ? void 0 : user.accountDetails) === null || _b === void 0 ? void 0 : _b.email,
                        avatar: (_c = user === null || user === void 0 ? void 0 : user.accountDetails) === null || _c === void 0 ? void 0 : _c.avatar,
                    },
                    personalDetails: {
                        name: (_d = user === null || user === void 0 ? void 0 : user.personalDetails) === null || _d === void 0 ? void 0 : _d.name,
                        description: (_e = user === null || user === void 0 ? void 0 : user.personalDetails) === null || _e === void 0 ? void 0 : _e.description,
                        headline: (_f = user === null || user === void 0 ? void 0 : user.personalDetails) === null || _f === void 0 ? void 0 : _f.headline,
                        phone: (_g = user === null || user === void 0 ? void 0 : user.personalDetails) === null || _g === void 0 ? void 0 : _g.phone,
                    },
                },
            };
        }
        catch (err) {
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getSellerByCheckout.js.map