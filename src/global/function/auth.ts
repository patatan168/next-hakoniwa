import 'server-only';

import { sessionSchemaType } from '@/db/schema/sessionTable';
import { default as META, default as META_DATA } from '@/global/define/metadata';
import sqlite from 'better-sqlite3';
import { deleteCookie } from 'cookies-next/client';
import { getCookie, setCookie } from 'cookies-next/server';
import * as jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
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
  const session_id = randomString(32);
  const { privateKey, publicKey } = es256Gen();
  const now = new Date();
  //NOTE: UNIX TIMEに合わせるためにミリ秒は丸める
  const express = Math.trunc(now.setHours(now.getHours() + META.EXPIRES_HOUR) / 1000);

  const deleteSession = client.prepare(
    `DELETE FROM session
      WHERE rowid IN (
        SELECT rowid FROM session
        WHERE uuid = ?
        ORDER BY expires ASC
        LIMIT (SELECT COUNT(*) - ${META.MAX_SESSIONS} FROM session WHERE uuid = ?)
      )`
  );
  const insertSession = client.prepare(
    `INSERT INTO session(uuid, session_id, public_key, expires) values(?, ?, ?, ?)`
  );

  client.transaction(() => {
    deleteSession.run(uuid, uuid);
    insertSession.run(uuid, session_id, publicKey, express);
  })();

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
      if (!uuid || !sessionId) {
        throw 'JWT Session Error';
      }
      const selectSession = client.prepare<[string, string], sessionSchemaType>(
        `SELECT public_key FROM session WHERE uuid = ? AND session_id = ?`
      );
      const { public_key } = selectSession.get(uuid, sessionId) || {};
      if (public_key === undefined) {
        throw 'Session DB Error';
      }

      // Verify
      jwt.verify(jwtToken, public_key, { algorithms: ['ES256'] });
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
      await deleteCookie('token');
      return undefined;
    }
  }
};
