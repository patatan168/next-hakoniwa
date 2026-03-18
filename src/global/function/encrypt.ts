/**
 * @module encrypt
 * @description 暗号化・ハッシュ・鍵生成ユーティリティ。
 */
import crypto, { generateKeyPairSync } from 'crypto';
import { uuidv7obj } from 'uuidv7';
import { secureRandom } from './utility';

/**
 * バイナリからUUID25を生成
 * @param bin UUIDv7のバイナリ
 * @returns UUID25
 */
function encodeUuid25FromBinary(bin: Uint8Array): string {
  // バイナリ16バイトを1つの巨大な数 (BigInt) に変換
  let num = 0n;
  for (const byte of bin) {
    num = (num << 8n) + BigInt(byte);
  }
  // Base62エンコード
  let res = '';
  while (num > 0n) {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    res = charset[Number(num % 62n)] + res;
    num = num / 62n;
  }
  return res.padStart(25, '0');
}

/**
 * UUIDを作成
 * @description UUIDv7からBase36に可逆エンコードしたUUID
 * @returns
 */
export const createUuid25 = () => {
  const uuid25 = encodeUuid25FromBinary(uuidv7obj().bytes);
  return uuid25;
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
 * ES384の秘密鍵と公開鍵を作成
 * @returns es384Gen.privateKey 秘密鍵
 * @returns es384Gen.publicKey 公開鍵
 */
export const es384Gen = () => {
  return generateKeyPairSync('ec', {
    namedCurve: 'P-384',
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

/**
 * クライアントハッシュにペッパーを付加して再ハッシュする（二段ハッシュ）
 * @param clientHash クライアントがSHA-256でハッシュ済みのフィンガープリント文字列
 * @param pepper サーバーシークレット
 * @returns SAH-256ハッシュ（16進数文字列）
 */
export const hashFingerprintWithPepper = (clientHash: string, pepper: string): string =>
  crypto.createHash('sha256').update(`${clientHash}${pepper}`).digest('hex');
