/**
 * @module admin-api/sign-in
 * @description 管理者ログインAPI。
 */
import { Database, db } from '@/db/kysely';
import META_DATA from '@/global/define/metadata';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Verify } from '@/global/function/argon2';
import { sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { createModeratorSession } from '@/global/function/moderatorAuth';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { adminSignInSchema } from '@/global/valid/server/admin';
import { Kysely, Transaction } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

async function updateLoginFailCount(
  client: Kysely<Database> | Transaction<Database>,
  uuid: string,
  failCount: number,
  lockedUntil: string | null
) {
  await client
    .updateTable('moderator_auth')
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

  const valid = await asyncRequestValid(request, adminSignInSchema);
  if (valid.data === null) return valid.response;

  const { id, password } = valid.data;
  const hashId = await sha256Gen(id);

  const auth = await db
    .selectFrom('moderator_auth')
    .select([
      'uuid',
      'password',
      'login_fail_count',
      'locked_until',
      'must_change_credentials',
      'user_name',
      'role',
    ])
    .where('id', '=', hashId)
    .executeTakeFirst();

  if (!auth) {
    return NextResponse.json(
      { error: 'ログインに失敗しました。IDとパスワードに誤りが無いか確認してください。' },
      { status: 401 }
    );
  }

  let failCount = auth.login_fail_count + 1;
  const now = new Date();
  const lockedUntil = auth.locked_until ? new Date(auth.locked_until) : null;
  if (lockedUntil !== null) {
    if (now < lockedUntil) {
      return NextResponse.json(
        { error: 'アカウントがロックされています。しばらくしてから再度お試しください。' },
        { status: 403 }
      );
    }
    failCount = 1;
  }

  const verified = await argon2Verify(auth.password, password);
  if (!verified) {
    const nextLockedUntil =
      failCount >= META_DATA.LOGIN_FAIL_LIMIT
        ? new Date(Date.now() + META_DATA.LOGIN_LOCK_MINUTE * 60 * 1000).toISOString()
        : null;

    await updateLoginFailCount(db, auth.uuid, failCount, nextLockedUntil);

    return NextResponse.json(
      { error: 'ログインに失敗しました。IDとパスワードに誤りが無いか確認してください。' },
      { status: 401 }
    );
  }

  await updateLoginFailCount(db, auth.uuid, 0, null);
  await createModeratorSession(db, auth.uuid);

  accessLogger(request).info(`Admin Sign In uuid=${auth.uuid} role=${auth.role}`);

  return NextResponse.json({
    result: true,
    mustChangeCredentials: auth.must_change_credentials === 1,
    userName: auth.user_name,
    role: auth.role,
  });
}
