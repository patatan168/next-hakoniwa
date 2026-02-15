import 'server-only';

import { refreshTokenSchemaType } from '@/db/schema/refreshTokenTable';
import { default as META } from '@/global/define/metadata';
import sqlite from 'better-sqlite3';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { es256Gen, es384Gen, randomString } from './encrypt';

/**
 * トークンオプション取得
 * @param isAccessToken アクセストークンorリフレッシュトークン
 */
const tokenOptions = (
  isAccessToken: boolean
): {
  cookieKey: string;
  tableName: string;
  algorithm: 'ES256' | 'ES384';
  sessionStrNum: number;
  expiresHour: number;
} => {
  return isAccessToken
    ? {
        cookieKey: '__Host-access_token',
        tableName: 'access_token',
        algorithm: 'ES256',
        sessionStrNum: 32,
        expiresHour: META.ACCESS_TOKEN_EXPIRES_HOUR,
      }
    : {
        cookieKey: '__Host-refresh_token',
        tableName: 'refresh_token',
        algorithm: 'ES384',
        sessionStrNum: 128,
        expiresHour: META.REFRESH_TOKEN_EXPIRES_HOUR,
      };
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
 * @param expiresIn 有効時間(時間)
 * @param isAccessToken アクセストークンorリフレッシュトークン
 */
const jwtOptions = (uuid: string, jwi: string, expiresIn: number, isAccessToken: boolean) => {
  const algorithm = tokenOptions(isAccessToken).algorithm;
  const options: jwt.SignOptions = {
    algorithm: algorithm,
    issuer: META.ISSUER,
    subject: uuid,
    jwtid: jwi,
    expiresIn: `${expiresIn}hour`,
  };
  return options;
};

/**
 * JWTトークンの作成
 * @param client データベース
 * @param uuid UUID
 * @param isAccessToken アクセストークンorリフレッシュトークン
 * @returns JWTトークン(署名付)
 */
export const createJwtToken = async (
  client: sqlite.Database,
  uuid: string,
  isAccessToken: boolean
) => {
  const { expiresHour, tableName, sessionStrNum } = tokenOptions(isAccessToken);
  // JWIを作成
  const jwi = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);
  // SessionIDを作成
  const session_id = randomString(sessionStrNum);
  const { privateKey, publicKey } = isAccessToken ? es256Gen() : es384Gen();

  const deleteSession = client.prepare(
    `DELETE FROM ${tableName}
      WHERE uuid = ? AND rowid NOT IN (
        SELECT rowid FROM ${tableName}
        WHERE uuid = ?
        ORDER BY expires DESC
        LIMIT ${META.MAX_SESSIONS} - 1
      )`
  );
  const insertSession = client.prepare(
    `INSERT INTO ${tableName}(uuid, session_id, public_key, expires) values(?, ?, ?, (unixepoch() + ${expiresHour} * 3600))`
  );

  client.transaction(() => {
    deleteSession.run(uuid, uuid);
    insertSession.run(uuid, session_id, publicKey);
  })();

  const newToken = jwt.sign(
    jwtPayload(session_id),
    privateKey,
    jwtOptions(uuid, jwi.toString(), expiresHour, isAccessToken)
  );

  await setAuthCookie(newToken, isAccessToken);
};

/**
 * JWTトークンの再生成
 * @param client データベース
 * @param isAccessToken アクセストークンorリフレッシュトークン
 * @param uuid UUID
 */
export const reCreateJwtToken = async (
  client: sqlite.Database,
  uuid: string,
  isAccessToken: boolean
) => {
  const { expiresHour, tableName, sessionStrNum } = tokenOptions(isAccessToken);

  const oldToken = await getAuthCookie(isAccessToken);
  if (!oldToken) throw 'No JWT Token';

  const rawOldToken = jwt.decode(oldToken, { json: true });
  if (!rawOldToken) throw 'JWT Decode Error';

  const oldSessionId = rawOldToken.session_id;
  if (!oldSessionId) throw 'JWT Session Error';

  // JWIを作成
  const jwi = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);
  // SessionIDを作成
  const session_id = randomString(sessionStrNum);
  const { privateKey, publicKey } = isAccessToken ? es256Gen() : es384Gen();

  const deleteSession = client.prepare(
    `DELETE FROM ${tableName}
      WHERE uuid = ? AND session_id = ?`
  );
  const insertSession = client.prepare(
    `INSERT INTO ${tableName}(uuid, session_id, public_key, expires) values(?, ?, ?, (unixepoch() + ${expiresHour} * 3600))`
  );

  client.transaction(() => {
    deleteSession.run(uuid, oldSessionId);
    insertSession.run(uuid, session_id, publicKey);
  })();

  const newToken = jwt.sign(
    jwtPayload(session_id),
    privateKey,
    jwtOptions(uuid, jwi.toString(), expiresHour, isAccessToken)
  );
  await setAuthCookie(newToken, isAccessToken);
};

/**
 * 認証用のJWTトークンをCookieに格納する
 * @param token JWTトークン
 * @param isAccessToken アクセストークンorリフレッシュトークン
 */
export const setAuthCookie = async (token: string, isAccessToken: boolean) => {
  const { expiresHour, cookieKey } = tokenOptions(isAccessToken);
  const cookieStore = await cookies();
  cookieStore.set(cookieKey, token, {
    maxAge: expiresHour * 60 * 60,
    sameSite: 'strict',
    secure: true,
    path: '/',
  });
};

/**
 * 認証用のJWTトークンをCookieから取得する
 * @param isAccessToken アクセストークンorリフレッシュトークン
 */
export const getAuthCookie = async (isAccessToken: boolean) => {
  const { cookieKey } = tokenOptions(isAccessToken);
  const cookieStore = await cookies();
  return cookieStore.get(cookieKey)?.value;
};

/**
 * 認証用のJWTトークンをCookieから削除する
 * @param isAccessToken アクセストークンorリフレッシュトークン
 */
export const deleteAuthCookie = async (isAccessToken: boolean) => {
  const { cookieKey } = tokenOptions(isAccessToken);
  const cookieStore = await cookies();
  cookieStore.set(cookieKey, '', {
    maxAge: 0,
    sameSite: 'strict',
    secure: true,
    path: '/',
  });
};

/**
 * 有効期限ギリギリのリフレッシュトークンで再認証された場合、新しいリフレッシュトークンを発行
 * @param client DBクライアント
 */
async function reCreateRefreshToken(client: sqlite.Database) {
  const refreshToken = await getAuthCookie(false);
  if (refreshToken) {
    const rawRefreshToken = jwt.decode(refreshToken, { json: true });
    // 有効期限ギリギリのリフレッシュトークンで再認証された場合、新しいリフレッシュトークンを発行
    if (rawRefreshToken?.exp) {
      const nowTime = Math.round(Date.now() / 1000);
      const remainTime = rawRefreshToken.exp - nowTime;
      if (remainTime < 0.8 * META.REFRESH_TOKEN_EXPIRES_HOUR * 3600) {
        const refreshUuid = await validAuthCookie(client, false);
        if (refreshUuid) {
          // リフレッシュトークンで再認証成功した場合は新しいリフレッシュトークンを発行
          await reCreateJwtToken(client, refreshUuid, false);
        }
      }
    }
  }
}

/**
 * アクセストークンがない場合、リフレッシュトークンで再認証
 * @param client DBクライアント
 */
async function reCreateAccessToken(client: sqlite.Database) {
  const uuid = await validAuthCookie(client, false);
  if (uuid) {
    // リフレッシュトークンで再認証成功した場合は新しいアクセストークンを発行
    await createJwtToken(client, uuid, true);
    return uuid;
  }
}

/**
 * クッキー認証
 * @note 認証に失敗したらundefined
 * @param client DBクライアント
 * @returns UUID
 */
export const validAuthCookie = async (
  client: sqlite.Database,
  isAccessToken: boolean
): Promise<string | undefined> => {
  const jwtToken = await getAuthCookie(isAccessToken);
  const { tableName, algorithm, expiresHour } = tokenOptions(isAccessToken);

  if (jwtToken) {
    const rawToken = jwt.decode(jwtToken, { json: true });
    // Decode Error
    if (rawToken === null) {
      throw 'JWT Decode Error';
    }
    try {
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
      const selectTokenTable = client.prepare<[string, string], refreshTokenSchemaType>(
        `SELECT public_key, created_at FROM ${tableName} WHERE uuid = ? AND session_id = ?`
      );
      const tokenData = selectTokenTable.get(uuid, sessionId);
      if (!tokenData) {
        throw `${tableName} Table Error`;
      }

      // Verify
      jwt.verify(jwtToken, tokenData.public_key, { algorithms: [algorithm] });

      // Token Refresh
      if (tokenData.created_at) {
        const now = Math.round(new Date().getTime() / 1000);
        const diffSec = now - tokenData.created_at;
        const refreshSec = 0.8 * expiresHour * 3600;
        if (diffSec > refreshSec) {
          if (isAccessToken) {
            await reCreateAccessToken(client);
          } else {
            await reCreateJwtToken(client, uuid, isAccessToken);
          }
        }
      }
      // 期限ギリギリのリフレッシュトークンで再認証された場合、新しいリフレッシュトークンを発行
      if (isAccessToken) {
        await reCreateRefreshToken(client);
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
      console.error(error);
      // Cookie削除
      await deleteAuthCookie(isAccessToken);
      if (error instanceof jwt.TokenExpiredError) {
        // トークン期限切れの場合はDBからセッション削除
        client
          .prepare(
            `DELETE FROM ${tableName}
           WHERE uuid = ? AND session_id = ?`
          )
          .run(rawToken.sub, rawToken.session_id);
        if (isAccessToken) {
          return await reCreateAccessToken(client);
        }
      }
      // Fail
      console.error(error);
      return undefined;
    }
  } else if (isAccessToken) {
    // アクセストークンがない場合、リフレッシュトークンで再認証
    return await reCreateAccessToken(client);
  }
  throw 'No JWT Token';
};

/**
 * サインアウト時にDBとCookieを削除する関数
 * @param client
 */
export const signOutDeleteJwtDbCookie = async (client: sqlite.Database) => {
  const accessToken = await getAuthCookie(true);
  const refreshToken = await getAuthCookie(false);
  // Cookie削除
  await deleteAuthCookie(true);
  await deleteAuthCookie(false);

  if (accessToken) {
    const { tableName: accessTokenTableName, algorithm: accessTokenAlgorithm } = tokenOptions(true);
    const rawToken = jwt.decode(accessToken, { json: true });
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
    const selectTokenTable = client.prepare<[string, string], refreshTokenSchemaType>(
      `SELECT public_key, created_at FROM ${accessTokenTableName} WHERE uuid = ? AND session_id = ?`
    );
    const tokenData = selectTokenTable.get(uuid, sessionId);
    if (tokenData) {
      // Verify
      jwt.verify(accessToken, tokenData.public_key, { algorithms: [accessTokenAlgorithm] });
      // セッション削除
      client
        .prepare(`DELETE FROM ${accessTokenTableName} WHERE uuid = ? AND session_id = ?`)
        .run(uuid, sessionId);
    }
  }
  if (refreshToken) {
    const { tableName: refreshTokenTableName, algorithm: refreshTokenAlgorithm } =
      tokenOptions(false);
    const rawToken = jwt.decode(refreshToken, { json: true });
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
    const selectTokenTable = client.prepare<[string, string], refreshTokenSchemaType>(
      `SELECT public_key, created_at FROM ${refreshTokenTableName} WHERE uuid = ? AND session_id = ?`
    );
    const tokenData = selectTokenTable.get(uuid, sessionId);
    if (tokenData) {
      // Verify
      jwt.verify(refreshToken, tokenData.public_key, { algorithms: [refreshTokenAlgorithm] });
      // セッション削除
      client
        .prepare(`DELETE FROM ${refreshTokenTableName} WHERE uuid = ? AND session_id = ?`)
        .run(uuid, sessionId);
    }
  }
};
