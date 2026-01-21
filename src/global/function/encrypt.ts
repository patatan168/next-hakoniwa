import crypto, { generateKeyPairSync } from 'crypto';
import { Uuid25 } from 'uuid25';
import { uuidv7obj } from 'uuidv7';
import { secureRandom } from './utility';

/**
 * UUIDを作成
 * @description UUIDv7からBase36に可逆エンコードしたUUID
 * @returns
 */
export const createUuid25 = () => {
  const uuid25 = Uuid25.fromBytes(uuidv7obj().bytes);
  return uuid25.value;
};

/**
 * SHA-256のハッシュ値を返す
 * @param text ハッシュ化するテキスト
 * @returns ハッシュ化されたテキスト
 */
export async function sha256Gen(text: string) {
  const uint8 = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', uint8);
  return Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * ES256の秘密鍵と公開鍵を作成
 * @returns es256Gen.privateKey 秘密鍵
 * @returns es256Gen.publicKey 公開鍵
 */
export const es256Gen = () => {
  return generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' },
  });
};

/**
 * ES512の秘密鍵と公開鍵を作成
 * @returns es512Gen.privateKey 秘密鍵
 * @returns es512Gen.publicKey 公開鍵
 */
export const es512Gen = () => {
  return generateKeyPairSync('ec', {
    namedCurve: 'P-521',
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' },
  });
};

/**
 * 特殊文字を含むランダムな文字列を生成
 * @param length 文字数
 */
export const randomString = (length: number) => {
  const str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+_@!?#$%&=-~^*';
  let result: string = '';
  for (let i = 0; i < length; i++) {
    const random = Math.trunc(secureRandom() * str.length);
    result = result + str[random];
  }
  return result;
};
