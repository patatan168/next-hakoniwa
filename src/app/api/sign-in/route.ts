import { authSchemaType } from '@/db/schema/authTable';
import META_DATA from '@/global/define/metadata';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Verify } from '@/global/function/argon2';
import { createJwtToken } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { signInUserInfoSchema } from '@/global/valid/userInfo';
import sqlite from 'better-sqlite3';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * ログイン失敗回数とロック時間を更新する
 * @param db データベース
 * @param uuid ユーザーUUID
 * @param failCount 失敗回数
 * @param lockedUntil ロック解除時間
 */
function updateLoginFailCount(
  db: sqlite.Database,
  uuid: string,
  failCount: number,
  lockedUntil: string | null
) {
  db.prepare<[number, string | null, string], void>(
    `UPDATE auth SET login_fail_count = ?, locked_until = ? WHERE uuid = ?`
  ).run(failCount, lockedUntil, uuid);
}

export async function POST(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');

  const valid = await asyncRequestValid(request, signInUserInfoSchema);

  if (valid.data !== null) {
    const { id, password } = valid.data;
    const hashId = await sha256Gen(id);
    const auth = db.client
      .prepare<
        string,
        authSchemaType
      >(`SELECT uuid, id, password, login_fail_count, locked_until FROM auth WHERE id = ?`)
      .get(hashId);

    if (auth !== undefined) {
      // ログイン失敗回数チェック
      let failCount = auth.login_fail_count + 1;

      const now = new Date();
      const lockedUntil = auth?.locked_until ? new Date(auth.locked_until) : null;
      if (lockedUntil !== null) {
        if (now < lockedUntil) {
          accessLogger(request).warn(`Locked Sign In Attempt`);
          return NextResponse.json(
            { error: `アカウントがロックされています。しばらくしてから再度お試しください。` },
            { status: 403 }
          );
        }
        // ロック解除時間を過ぎていたら失敗回数リセット
        failCount = 1;
      }

      const verify = await argon2Verify(auth.password, password);
      if (verify) {
        const responseOK = NextResponse.json({ result: true });
        const lockedUntil = null;
        // ログイン成功時は失敗回数リセット
        failCount = 0;

        updateLoginFailCount(db.client, auth.uuid, failCount, lockedUntil);

        // アクセストークンとリフレッシュトークンを発行
        await createJwtToken(db.client, auth.uuid, false);
        await createJwtToken(db.client, auth.uuid, true);
        accessLogger(request).info(`Sign In uuid=${auth.uuid}`);

        return responseOK;
      } else {
        const lockedUntil =
          failCount >= META_DATA.LOGIN_FAIL_LIMIT
            ? new Date(Date.now() + META_DATA.LOGIN_LOCK_MINUTE * 60 * 1000).toISOString()
            : null;

        updateLoginFailCount(db.client, auth.uuid, failCount, lockedUntil);

        accessLogger(request).warn(`Unauthorized Sign In`);
        return NextResponse.json(
          { error: 'ログインに失敗しました。IDとパスワードに誤りが無いか確認してください。' },
          { status: 401 }
        );
      }
    } else {
      accessLogger(request).warn(`Unauthorized Sign In`);
      return NextResponse.json(
        { error: 'ログインに失敗しました。IDとパスワードに誤りが無いか確認してください。' },
        { status: 401 }
      );
    }
  }
  return valid.response;
}
