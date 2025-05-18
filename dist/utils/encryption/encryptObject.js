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
import encrypt from './encrypt';
import decryptObject from './decryptObject';
import AwsSecrets from '../getAwsSecrets';
export default function encryptObject(existingObj, updateData, fieldsToEncrypt) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ENV_VALUES = yield AwsSecrets.getInstance();
            const mergeCustomizer = (objValue, srcValue) => {
                if (_.isArray(objValue)) {
                    return srcValue;
                }
            };
            const decryptedObject = yield decryptObject(existingObj);
            const mergedObject = _.merge(decryptedObject, updateData, mergeCustomizer);
            for (const field of fieldsToEncrypt) {
                const data = _.get(mergedObject, field);
                if (data) {
                    const encryptedValue = yield encrypt(data, ENV_VALUES.ENCRYPTION_SECRET);
                    const encryptedFieldKey = `__enc_${_.takeRight(field.split('.'))[0]}`;
                    const encrypedFieldPathStart = _.dropRight(field.split('.'));
                    encrypedFieldPathStart.push(encryptedFieldKey);
                    const finalEncryptedFieldPath = encrypedFieldPathStart.join('.');
                    _.set(mergedObject, field, encryptedValue);
                    _.set(mergedObject, finalEncryptedFieldPath, true);
                }
            }
            _.set(mergedObject, '__v_enc', 1);
            return mergedObject;
        }
        catch (err) {
            throw err;
        }
    });
}
//# sourceMappingURL=encryptObject.js.map