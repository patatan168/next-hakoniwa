import 'server-only';

import { sessionSchemaType } from '@/db/schema/sessionTable';
import { default as META, default as META_DATA } from '@/global/define/metadata';
import sqlite from 'better-sqlite3';
import { getCookie, setCookie } from 'cookies-next/server';
import * as jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import crypto, { generateKeyPairSync } from 'node:crypto';
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
const es256Gen = () => {
  return generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' },
  });
};

/**
 * 特殊文字を含むランダムな文字列を生成
 * @param length 文字数
 */
const randomString = (length: number) => {
  const str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+_@!?#$%&=-~^*';
  let result: string = '';
  for (let i = 0; i < length; i++) {
    const random = Math.trunc(secureRandom() * str.length);
    result = result + str[random];
  }
  return result;
};

/**
 * JWTのペイロード
 */
const jwtPayload = (session_id: string) => {
  return { session_id: session_id };
};

/**
 * 予約済みのペイロード
 * @param uuid UUID
 * @param jwi Session Id
 */
const jwtOptions = (uuid: string, jwi: string) => {
  const options: jwt.SignOptions = {
    algorithm: 'ES256',
    issuer: META.ISSUER,
    subject: uuid,
    jwtid: jwi,
    expiresIn: `${META.EXPIRES_HOUR}hour`,
  };
  return options;
};

/**
 * JWTトークンの作成
 * @param client データベース
 * @param uuid UUID
 * @returns JWTトークン(署名付)
 */
export const createJwtToken = (client: sqlite.Database, uuid: string) => {
  // JWIを作成
  const jwi = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);
  // SessionIDを作成
  const session_id = randomString(32);
  const { privateKey, publicKey } = es256Gen();
  const now = new Date();
  //NOTE: UNIX TIMEに合わせるためにミリ秒は丸める
  const express = Math.trunc(now.setHours(now.getHours() + META.EXPIRES_HOUR) / 1000);

  const insertSession = client.prepare(
    `INSERT INTO session(uuid, session_id, public_key, expires) values(?, ?, ?, ?)`
  );

  insertSession.run(uuid, session_id, publicKey, express);

  return jwt.sign(jwtPayload(session_id), privateKey, jwtOptions(uuid, jwi.toString()));
};

/**
 * 認証用のJWTトークンをCookieに格納する
 * @param token JWTトークン
 * @param response Next.jsのレスポンス
 * @param request Next.jsのリクエスト
 */
export const setAuthCookie = async (
  token: string,
  response: NextResponse,
  request: NextRequest
) => {
  await setCookie('token', token, {
    res: response,
    req: request,
    maxAge: META_DATA.EXPIRES_HOUR * 60 * 60,
    sameSite: 'lax',
  });
};

/**
 * クッキー認証
 * @note 認証に失敗したらundefined
 * @param client DBクライアント
 * @param response Next.jsのレスポンス
 * @param request Next.jsのリクエスト
 * @returns UUID
 */
export const validAuthCookie = async (
  client: sqlite.Database,
  response: NextResponse,
  request: NextRequest
) => {
  const jwtToken = await getCookie('token', {
    res: response,
    req: request,
  });

  if (jwtToken !== undefined) {
    try {
      const rawToken = jwt.decode(jwtToken, { json: true });

      // Decode Error
      if (rawToken === null) {
        throw 'JWT Decode Error';
      }
      // Issuer Error
      const issuer = rawToken.iss;
      if (issuer !== META.ISSUER) {
        throw 'JWT Issuer Error';
      }
      // Session Error
      const uuid = rawToken.sub;
      const sessionId = rawToken.session_id;
      const selectSession = client.prepare(
        `SELECT public_key FROM session WHERE uuid = ? AND session_id = ?`
      );
      const { public_key } = selectSession.get(uuid, sessionId) as sessionSchemaType;
      if (public_key === undefined) {
        throw 'Session DB Error';
      }

      // Verify
      jwt.verify(jwtToken, public_key, { algorithms: ['ES256'] });
      // Success
      return uuid;
    } catch (error) {
      // Fail
      console.error(error);
      return undefined;
    }
  }
};
