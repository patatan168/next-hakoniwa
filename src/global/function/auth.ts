/**
 * @module auth
 * @description JWTトークンの発行・検証・ローテーションとCookie管理を提供する認証モジュール。
 */
import 'server-only';

import { Database, isSqlite } from '@/db/kysely';
import { default as META } from '@/global/define/metadata';
import * as jwt from 'jsonwebtoken';
import { Kysely, sql, Transaction } from 'kysely';
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
  tableName: 'access_token' | 'refresh_token';
  algorithm: 'ES256' | 'ES384';
  sessionStrNum: number;
  expiresHour: number;
} => {
  return isAccessToken
    ? {
        cookieKey: '__Host-Http-access_token',
        tableName: 'access_token',
        algorithm: 'ES256',
        sessionStrNum: 32,
        expiresHour: META.ACCESS_TOKEN_EXPIRES_HOUR,
      }
    : {
        cookieKey: '__Host-Http-refresh_token',
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
 * @param limitSessions セッション上限を超えた古いセッションを削除するか（デフォルト: true）
 * @returns JWTトークン(署名付)
 * @remarks アクセストークン自動更新時は limitSessions=false を渡し、別端末のセッション削除を防ぐ
 */
export const createJwtToken = async (
  client: Kysely<Database> | Transaction<Database>,
  uuid: string,
  isAccessToken: boolean,
  limitSessions = true
) => {
  const { expiresHour, tableName, sessionStrNum } = tokenOptions(isAccessToken);
  // JWIを作成
  const jwi = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER);
  // SessionIDを作成
  const session_id = randomString(sessionStrNum);
  const { privateKey, publicKey } = isAccessToken ? es256Gen() : es384Gen();

  // SQLite: `datetime(unixepoch() + N * 3600, 'unixepoch')` → MySQL: `DATE_ADD(NOW(), INTERVAL N HOUR)`
  const expiresSql = isSqlite
    ? sql<string>`datetime(unixepoch() + ${expiresHour} * 3600, 'unixepoch')`
    : sql<string>`DATE_ADD(NOW(), INTERVAL ${expiresHour} HOUR)`;

  await client.transaction().execute(async (trx) => {
    // セッション上限を超えた古いセッションを削除（ログイン時のみ実行）
    if (limitSessions) {
      // SQLite: rowid で識別、MySQL: id カラムで識別
      if (isSqlite) {
        await sql`DELETE FROM ${sql.table(tableName)}
          WHERE uuid = ${uuid} AND rowid NOT IN (
            SELECT rowid FROM ${sql.table(tableName)}
            WHERE uuid = ${uuid}
            ORDER BY expires DESC
            LIMIT ${META.MAX_SESSIONS - 1}
          )`.execute(trx);
      } else {
        await sql`DELETE FROM ${sql.table(tableName)}
          WHERE uuid = ${uuid} AND id NOT IN (
            SELECT id FROM (
              SELECT id FROM ${sql.table(tableName)}
              WHERE uuid = ${uuid}
              ORDER BY expires DESC
              LIMIT ${META.MAX_SESSIONS - 1}
            ) AS sub
          )`.execute(trx);
      }
    }

    await trx
      .insertInto(tableName)
      .values({
        uuid,
        session_id,
        public_key: publicKey,
        expires: expiresSql,
      })
      .execute();
  });

  const newToken = jwt.sign(
    jwtPayload(session_id),
    privateKey,
    jwtOptions(uuid, jwi.toString(), expiresHour, isAccessToken)
  );

  await setAuthCookie(newToken, isAccessToken);
  if (!isAccessToken) {
    await setExistsRefreshToken();
  }
};

/**
 * JWTトークンの再生成
 * @param client データベース
 * @param isAccessToken アクセストークンorリフレッシュトークン
 * @param uuid UUID
 */
async function reCreateJwtToken(
  client: Kysely<Database> | Transaction<Database>,
  uuid: string,
  isAccessToken: boolean
) {
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

  const expiresSql = isSqlite
    ? sql<string>`datetime(unixepoch() + ${expiresHour} * 3600, 'unixepoch')`
    : sql<string>`DATE_ADD(NOW(), INTERVAL ${expiresHour} HOUR)`;

  await client.transaction().execute(async (trx) => {
    await trx
      .deleteFrom(tableName)
      .where('uuid', '=', uuid)
      .where('session_id', '=', oldSessionId)
      .execute();

    await trx
      .insertInto(tableName)
      .values({
        uuid,
        session_id,
        public_key: publicKey,
        expires: expiresSql,
      })
      .execute();
  });

  const newToken = jwt.sign(
    jwtPayload(session_id),
    privateKey,
    jwtOptions(uuid, jwi.toString(), expiresHour, isAccessToken)
  );
  await setAuthCookie(newToken, isAccessToken);
}

/**
 * 認証用のJWTトークンをCookieに格納する
 * @param token JWTトークン
 * @param isAccessToken アクセストークンorリフレッシュトークン
 */
async function setAuthCookie(token: string, isAccessToken: boolean) {
  const { expiresHour, cookieKey } = tokenOptions(isAccessToken);
  const cookieStore = await cookies();
  cookieStore.set(cookieKey, token, {
    maxAge: expiresHour * 60 * 60,
    sameSite: 'strict',
    httpOnly: true,
    secure: true,
    path: '/',
  });
}

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
async function deleteAuthCookie(isAccessToken: boolean) {
  const { cookieKey } = tokenOptions(isAccessToken);
  const cookieStore = await cookies();
  cookieStore.set(cookieKey, '', {
    maxAge: 0,
    sameSite: 'strict',
    httpOnly: true,
    secure: true,
    path: '/',
  });
}

/**
 * リフレッシュトークンが存在するかどうかをCookieに格納する
 */
async function setExistsRefreshToken() {
  const maxAge = tokenOptions(false).expiresHour * 60 * 60;
  const cookieStore = await cookies();
  cookieStore.set('__Host-exists_refresh_token', 'true', {
    maxAge,
    sameSite: 'strict',
    secure: true,
    path: '/',
  });
}

/**
 * リフレッシュトークンが存在するかどうかをCookieから削除する
 */
async function deleteExistsRefreshToken() {
  const cookieStore = await cookies();
  cookieStore.set('__Host-exists_refresh_token', '', {
    maxAge: 0,
    sameSite: 'strict',
    secure: true,
    path: '/',
  });
}

/**
 * 有効期限ギリギリのリフレッシュトークンで再認証された場合、新しいリフレッシュトークンを発行
 * @param client DBクライアント
 */
async function reCreateRefreshToken(client: Kysely<Database> | Transaction<Database>) {
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
 * @remarks セッション上限削除はスキップして別端末のセッションを保護する
 */
async function reCreateAccessToken(client: Kysely<Database> | Transaction<Database>) {
  const uuid = await validAuthCookie(client, false);
  if (uuid) {
    // limitSessions=false: 自動更新によって別端末のセッションを削除しない
    await createJwtToken(client, uuid, true, false);
    return uuid;
  }
}

/**
 * クッキー認証
 * @note 認証に失敗したらundefined
 * @param client DBクライアント
 * @param isAccessToken アクセストークンorリフレッシュトークン
 * @returns UUID
 */
export const validAuthCookie = async (
  client: Kysely<Database> | Transaction<Database>,
  isAccessToken: boolean
): Promise<string | undefined> => {
  const jwtToken = await getAuthCookie(isAccessToken);

  // トークンが無い場合の早期リターン
  if (!jwtToken) {
    if (isAccessToken) return await reCreateAccessToken(client);
    return undefined;
  }

  const { tableName, algorithm, expiresHour } = tokenOptions(isAccessToken);
  const rawToken = jwt.decode(jwtToken, { json: true }) as jwt.JwtPayload | null;

  // バリデーション失敗時の共通処理
  const abortAuth = async (msg: string) => {
    console.error(msg);
    await deleteAuthCookie(isAccessToken);
    await deleteExistsRefreshToken();
    return undefined;
  };

  if (!rawToken) {
    return await abortAuth('JWT Decode Error');
  }

  if (rawToken.iss !== META.ISSUER) {
    return await abortAuth('JWT Issuer Error');
  }

  const uuid = rawToken.sub as string | undefined;
  const sessionId = rawToken.session_id as string | undefined;

  if (!uuid || !sessionId) {
    return await abortAuth('JWT Session Error');
  }

  const tokenData = await client
    .selectFrom(tableName)
    .select(['public_key', 'created_at'])
    .where('uuid', '=', uuid)
    .where('session_id', '=', sessionId)
    .executeTakeFirst();

  if (!tokenData) {
    return await abortAuth(`${tableName} Table Error`);
  }

  // 電子署名検証の例外ハンドリング
  const handleVerifyError = async (error: unknown) => {
    console.error(error);
    await deleteAuthCookie(isAccessToken);

    if (error instanceof jwt.TokenExpiredError) {
      await client
        .deleteFrom(tableName)
        .where('uuid', '=', uuid)
        .where('session_id', '=', sessionId)
        .execute();
      if (isAccessToken) return await reCreateAccessToken(client);
    }

    await deleteExistsRefreshToken();
    return undefined;
  };

  try {
    jwt.verify(jwtToken, tokenData.public_key, { algorithms: [algorithm] });
  } catch (error) {
    return await handleVerifyError(error);
  }

  // リフレッシュトークンの場合のみ、トークンの再生成（ローテーション）を行う
  if (!isAccessToken) {
    const handleTokenRefresh = async () => {
      if (!tokenData.created_at) return;
      const diffSec = Math.trunc(Date.now() / 1000) - Number(tokenData.created_at);
      if (diffSec <= 0.8 * expiresHour * 3600) return;

      await reCreateJwtToken(client, uuid, false);
    };

    await handleTokenRefresh();
  } else {
    // アクセストークンの場合は、リフレッシュトークン側が期限切れ間近なら再生成を試みる
    await reCreateRefreshToken(client);
  }

  // 10分以内にログインしていなければ最終ログイン時間を更新
  // SQLite: unixepoch()、MySQL: UNIX_TIMESTAMP()
  if (isSqlite) {
    await sql`UPDATE last_login
         SET last_login_at = unixepoch()
         WHERE uuid = ${uuid}
           AND last_login_at < unixepoch() - 600`.execute(client);
  } else {
    await sql`UPDATE last_login
         SET last_login_at = UNIX_TIMESTAMP()
         WHERE uuid = ${uuid}
           AND last_login_at < UNIX_TIMESTAMP() - 600`.execute(client);
  }

  return uuid;
};

/**
 * サインアウト時にDBとCookieを削除する関数
 * @param client
 */
export const signOutDeleteJwtDbCookie = async (
  client: Kysely<Database> | Transaction<Database>
) => {
  const accessToken = await getAuthCookie(true);
  const refreshToken = await getAuthCookie(false);

  // Cookie削除
  await deleteAuthCookie(true);
  await deleteAuthCookie(false);
  await deleteExistsRefreshToken();

  // DBセッション削除用の内部ヘルパー関数
  const deleteDbSession = async (tokenStr: string, isAccessToken: boolean) => {
    const { tableName, algorithm } = tokenOptions(isAccessToken);
    const rawToken = jwt.decode(tokenStr, { json: true }) as jwt.JwtPayload | null;

    if (!rawToken) {
      console.error('JWT Decode Error');
      return;
    }

    if (rawToken.iss !== META.ISSUER) {
      console.error('JWT Issuer Error');
      return;
    }

    const uuid = rawToken.sub as string | undefined;
    const sessionId = rawToken.session_id as string | undefined;

    if (!uuid || !sessionId) {
      console.error('JWT Session Error');
      return;
    }

    const tokenData = await client
      .selectFrom(tableName)
      .select(['public_key', 'created_at'])
      .where('uuid', '=', uuid)
      .where('session_id', '=', sessionId)
      .executeTakeFirst();

    if (!tokenData) return;

    try {
      jwt.verify(tokenStr, tokenData.public_key, { algorithms: [algorithm] });
      await client
        .deleteFrom(tableName)
        .where('uuid', '=', uuid)
        .where('session_id', '=', sessionId)
        .execute();
    } catch (error) {
      console.error(error);
    }
  };

  if (accessToken) await deleteDbSession(accessToken, true);
  if (refreshToken) await deleteDbSession(refreshToken, false);
};
