/**
 * @module sign-in
 * @description サインイン認証を処理するAPIルート。
 */
import { Database, db } from '@/db/kysely';
import META_DATA from '@/global/define/metadata';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Verify } from '@/global/function/argon2';
import { createJwtToken } from '@/global/function/auth';
import { sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { signInUserInfoSchema } from '@/global/valid/userInfo';
import { Kysely, Transaction } from 'kysely';
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
async function updateLoginFailCount(
  client: Kysely<Database> | Transaction<Database>,
  uuid: string,
  failCount: number,
  lockedUntil: string | null
) {
  await client
    .updateTable('auth')
    .set({
      login_fail_count: failCount,
      locked_until: lockedUntil,
    })
    .where('uuid', '=', uuid)
    .execute();
}

export async function POST(request: NextRequest) {
  if (await isTurnProcessing()) {
    return turnProcessingResponse();
  }

  const valid = await asyncRequestValid(request, signInUserInfoSchema);

  if (valid.data !== null) {
    const { id, password } = valid.data;
    const hashId = await sha256Gen(id);
    const auth = await db
      .selectFrom('auth')
      .select(['uuid', 'id', 'password', 'login_fail_count', 'locked_until'])
      .where('id', '=', hashId)
      .executeTakeFirst();

    if (auth !== undefined) {
      // ログイン失敗回数チェック
      let failCount = auth.login_fail_count + 1;

      const now = new Date();
      const lockedUntil = auth?.locked_until ? new Date(auth.locked_until) : null;
      if (lockedUntil !== null) {
        if (now < lockedUntil) {
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

        await updateLoginFailCount(db, auth.uuid, failCount, lockedUntil);

        // アクセストークンとリフレッシュトークンを発行
        await createJwtToken(db, auth.uuid, false);
        await createJwtToken(db, auth.uuid, true);
        accessLogger(request).info(`Sign In uuid=${auth.uuid}`);

        return responseOK;
      } else {
        const lockedUntil =
          failCount >= META_DATA.LOGIN_FAIL_LIMIT
            ? new Date(Date.now() + META_DATA.LOGIN_LOCK_MINUTE * 60 * 1000).toISOString()
            : null;

        await updateLoginFailCount(db, auth.uuid, failCount, lockedUntil);

        return NextResponse.json(
          { error: 'ログインに失敗しました。IDとパスワードに誤りが無いか確認してください。' },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'ログインに失敗しました。IDとパスワードに誤りが無いか確認してください。' },
        { status: 401 }
      );
    }
  }
  return valid.response;
}
