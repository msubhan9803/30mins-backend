var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import escapeStringRegexp from 'escape-string-regexp';
import User from '../MongoModels/User';
export default function generateUsername(name, num) {
    return __awaiter(this, void 0, void 0, function* () {
        const generatedUsername = `${name.replace(/\s/g, '')}${num}`;
        const safeUsername = escapeStringRegexp(generatedUsername);
        const pattern = `^${safeUsername}$`;
        const regex = new RegExp(pattern, 'i');
        const existingUsername = yield User.exists({ 'accountDetails.username': { $regex: regex } });
        if (existingUsername) {
            generateUsername(name, num + 1);
        }
        else {
            return generatedUsername;
        }
    });
}
//# sourceMappingURL=generateUsername.js.map