import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const keyRaw = process.env.MASTER_KEY;

const getMasterKey = () => {
  if (!keyRaw) throw new Error('MASTER_KEY is required');
  const key = Buffer.from(keyRaw, 'base64');
  if (key.length !== 32) throw new Error('MASTER_KEY must decode to 32 bytes');
  return key;
};

export const encryptSecret = (plain: string) => {
  const key = getMasterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted_key: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    last4: plain.slice(-4)
  };
};

export const decryptSecret = (encrypted_key: string, iv: string, tag: string) => {
  const key = getMasterKey();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted_key, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
};
