/**
 * Argon2によるハッシュ化と検証
 * @packageDocumentation
 * @module function/argon2
 * @author patatan
 * @note server-onlyにしないとargon2は動作しない
 */
import 'server-only';

import * as argon2 from 'argon2';

/**
 * Argon2のハッシュ値を返す
 * @param text ハッシュ化するテキスト
 * @returns ハッシュ化されたテキスト
 */
export async function argon2Gen(text: string) {
  return await argon2.hash(text);
}

/**
 * Argon2の検証
 * @param hash ハッシュ化されたテキスト
 * @param rawText 生のテキスト
 * @returns 検証結果
 */
export async function argon2Verify(hash: string, rawText: string) {
  return await argon2.verify(hash, rawText);
}
