/**
 * @module uuid
 * @description UUID生成ユーティリティ。
 */
import { uuidv7obj } from 'uuidv7';

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
 * @returns UUID
 */
export const createUuid25 = () => {
  const uuid25 = encodeUuid25FromBinary(uuidv7obj().bytes);
  return uuid25;
};
