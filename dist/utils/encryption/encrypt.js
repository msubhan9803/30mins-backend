var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import crypto from 'crypto';
import AwsSecrets from '../getAwsSecrets';
export default function encrypt(clearText, secret) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            const iv = ENV_VALUES.ENCRYPTION_SALT;
            const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);
            const encrypted = cipher.update(clearText);
            const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
            const encryptedHex = iv + ':' + finalBuffer.toString('hex');
            return encryptedHex;
        }
        catch (err) {
            console.log('ERROR');
        }
    });
}
//# sourceMappingURL=encrypt.js.map