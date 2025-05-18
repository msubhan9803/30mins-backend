var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import _ from 'lodash';
import decrypt from './decrypt';
import mongoose from 'mongoose';
import AwsSecrets from '../getAwsSecrets';
export default function decryptObject(obj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            // Will only work with a Mongoose Object (.toObject transforms the object into a raw object without Mongoose Methods)
            const objectToDecrypt = obj instanceof mongoose.Document ? obj.toObject() : obj;
            const decryptCurrent = currObj => {
                _.forOwn(currObj, (val, key) => {
                    if (_.isArray(val)) {
                        return;
                    }
                    else if (_.isObject(val)) {
                        decryptCurrent(val);
                    }
                    else {
                        if (key.split('_')[2] === 'enc' && val) {
                            const keyToDecrypt = key.replace('__enc_', '');
                            const valueToDecrypt = _.get(currObj, keyToDecrypt);
                            const decryptedValue = decrypt(valueToDecrypt, ENV_VALUES.ENCRYPTION_SECRET);
                            _.set(currObj, keyToDecrypt, decryptedValue);
                            _.unset(currObj, key);
                        }
                    }
                });
            };
            decryptCurrent(objectToDecrypt);
            return objectToDecrypt;
        }
        catch (err) {
            throw err;
        }
    });
}
//# sourceMappingURL=decryptObject.js.map