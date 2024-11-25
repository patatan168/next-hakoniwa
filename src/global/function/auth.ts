import { sessionSchemaType } from '@/db/schema/sessionTable';
import { default as META, default as META_DATA } from '@/global/define/metadata';
import sqlite from 'better-sqlite3';
import { getCookie, setCookie } from 'cookies-next';
import * as jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import crypto, { generateKeyPairSync } from 'node:crypto';

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
 * @returns es256Gen.publickKey 公開鍵
 */
const es256Gen = () => {
  return generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' },
  });
};

/**
 * JWTのペイロード
 * @note 今のところ予約済みのもの以外は無し
 */
const jwtPayload = {};

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
  // JWI(SESSION ID)を作成
  const jwi = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);
  const { privateKey, publicKey } = es256Gen();
  const now = new Date();
  //NOTE: UNIX TIME似合わせるためにミリ秒は丸める
  const express = Math.trunc(now.setHours(now.getHours() + META.EXPIRES_HOUR) / 1000);

  const insertSession = client.prepare(
    `INSERT INTO session(uuid, session_id, public_key, expires) values(?, ?, ?, ?)`
  );

  insertSession.run(uuid, jwi, publicKey, express);

  return jwt.sign(jwtPayload, privateKey, jwtOptions(uuid, jwi.toString()));
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
 * @param client DBクライアント
 * @param response Next.jsのレスポンス
 * @param request Next.jsのリクエスト
 * @returns 認証の成否
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

  let valid = false;

  if (jwtToken !== undefined) {
    try {
      const rawToken = jwt.decode(jwtToken, { json: true });
      if (rawToken === null) {
        console.error('JWT Decode Error');
        return false;
      }

      const uuid = rawToken.sub;
      const sessionId = rawToken.jti;
      const selectSession = client.prepare(
        `SELECT public_key FROM session WHERE uuid = ? AND session_id = ?`
      );
      const { public_key } = selectSession.get(uuid, sessionId) as sessionSchemaType;
      if (public_key === undefined) {
        console.error('Session DB Error');
        return false;
      }

      // Verify
      jwt.verify(jwtToken, public_key);
      // Sucess
      valid = true;
    } catch {
      // Fail
      console.error('JWT Verify Fail');
      valid = false;
    }
  }
  return valid;
};
