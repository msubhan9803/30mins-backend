var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import AWS from 'aws-sdk';
const AwsSecrets = (() => {
    let instance;
    const createInstance = () => {
        const secretManager = new AWS.SecretsManager({ region: 'us-east-2' });
        const secretId = process.env.NODE_ENV === 'production' ? '30mins-prod' : '30mins-stage';
        const secrets = new Promise((resolve, reject) => {
            //retrieving secrets from secrets manager
            secretManager.getSecretValue({ SecretId: secretId }, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(JSON.parse(data.SecretString));
                }
            });
        });
        return secrets;
    };
    return {
        getInstance: () => __awaiter(void 0, void 0, void 0, function* () {
            if (!instance) {
                instance = yield createInstance();
            }
            return instance;
        }),
    };
})();
export default AwsSecrets;
//# sourceMappingURL=getAwsSecrets.js.map