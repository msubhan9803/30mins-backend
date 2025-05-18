import crypto from 'crypto';
import AwsSecrets from '../getAwsSecrets';

export default async function encrypt(clearText, secret) {
  try {
    const ENV_VALUES = await AwsSecrets.getInstance();

    const iv = ENV_VALUES.ENCRYPTION_SALT;
    const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);
    const encrypted = cipher.update(clearText);
    const finalBuffer = Buffer.concat([encrypted, cipher.final()]);
    const encryptedHex = iv + ':' + finalBuffer.toString('hex');
    return encryptedHex;
  } catch (err) {
    console.log('ERROR');
  }
}
