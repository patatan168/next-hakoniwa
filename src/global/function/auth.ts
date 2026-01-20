import 'server-only';

import { sessionSchemaType } from '@/db/schema/sessionTable';
import { default as META, default as META_DATA } from '@/global/define/metadata';
import sqlite from 'better-sqlite3';
import { deleteCookie, getCookie, setCookie } from 'cookies-next/server';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { es256Gen, randomString } from './encrypt';

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
  const session_id = randomString(64);
  const { privateKey, publicKey } = es256Gen();

  const deleteSession = client.prepare(
    `DELETE FROM session
      WHERE uuid = ? AND rowid NOT IN (
        SELECT rowid FROM session
        WHERE uuid = ?
        ORDER BY expires DESC
        LIMIT ${META.MAX_SESSIONS} - 1
      )`
  );
  const insertSession = client.prepare(
    `INSERT INTO session(uuid, session_id, public_key, expires) values(?, ?, ?, (unixepoch() + ${META.EXPIRES_HOUR} * 3600))`
  );

  client.transaction(() => {
    deleteSession.run(uuid, uuid);
    insertSession.run(uuid, session_id, publicKey);
  })();

  return jwt.sign(jwtPayload(session_id), privateKey, jwtOptions(uuid, jwi.toString()));
};

/**
 * JWTトークンの再生成
 * @param client データベース
 * @param uuid UUID
 */
export const refreshJwtToken = async (client: sqlite.Database, uuid: string) => {
  const oldToken = await getCookie('token', { cookies });
  if (!oldToken) throw 'No JWT Token';

  const rawOldToken = jwt.decode(oldToken, { json: true });
  if (!rawOldToken) throw 'JWT Decode Error';

  const oldSessionId = rawOldToken.session_id;
  if (!oldSessionId) throw 'JWT Session Error';

  // JWIを作成
  const jwi = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);
  // SessionIDを作成
  const session_id = randomString(64);
  const { privateKey, publicKey } = es256Gen();

  const deleteSession = client.prepare(
    `DELETE FROM session
      WHERE uuid = ? AND session_id = ?`
  );
  const insertSession = client.prepare(
    `INSERT INTO session(uuid, session_id, public_key, expires) values(?, ?, ?, (unixepoch() + ${META.EXPIRES_HOUR} * 3600))`
  );

  client.transaction(() => {
    deleteSession.run(uuid, oldSessionId);
    insertSession.run(uuid, session_id, publicKey);
  })();

  const newToken = jwt.sign(jwtPayload(session_id), privateKey, jwtOptions(uuid, jwi.toString()));
  await setAuthCookie(newToken);
};

/**
 * 認証用のJWTトークンをCookieに格納する
 * @param token JWTトークン
 */
export const setAuthCookie = async (token: string) => {
  await setCookie('token', token, {
    cookies,
    maxAge: META_DATA.EXPIRES_HOUR * 60 * 60,
    sameSite: 'lax',
  });
};

/**
 * クッキー認証
 * @note 認証に失敗したらundefined
 * @param client DBクライアント
 * @returns UUID
 */
export const validAuthCookie = async (client: sqlite.Database, refresh = false) => {
  const jwtToken = await getCookie('token', { cookies });

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
      if (!uuid || !sessionId) {
        throw 'JWT Session Error';
      }
      const selectSession = client.prepare<[string, string], sessionSchemaType>(
        `SELECT public_key, created_at FROM session WHERE uuid = ? AND session_id = ?`
      );
      const { public_key, created_at } = selectSession.get(uuid, sessionId) || {};
      if (public_key === undefined) {
        throw 'Session DB Error';
      }

      // Verify
      jwt.verify(jwtToken, public_key, { algorithms: ['ES256'] });

      // Token Refresh
      if (refresh && created_at) {
        const now = Math.round(new Date().getTime() / 1000);
        const diffSec = now - created_at;
        if (diffSec > 30) await refreshJwtToken(client, uuid);
      }

      // 10分以内にログインしていなければ最終ログイン時間を更新
      client
        .prepare(
          `UPDATE last_login
           SET last_login_at = unixepoch()
           WHERE uuid = ?
             AND last_login_at < unixepoch() - 600`
        )
        .run(uuid);
      // Success
      return uuid;
    } catch (error) {
      // Fail
      console.error(error);
      // Cookie削除
      await deleteCookie('token', { cookies });
      return undefined;
    }
  }
};
