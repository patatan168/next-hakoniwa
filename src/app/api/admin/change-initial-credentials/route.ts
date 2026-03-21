/**
 * @module admin-api/change-initial-credentials
 * @description 管理者の初回資格情報変更API。
 */
import { db } from '@/db/kysely';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Gen, argon2Verify } from '@/global/function/argon2';
import { sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { adminCredentialChangeSchema } from '@/global/valid/server/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function PUT(request: NextRequest) {
  const uuid = request.headers.get('x-verified-admin-uuid');
  if (!uuid) {
    return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
  }

  const valid = await asyncRequestValid(request, adminCredentialChangeSchema);
  if (valid.data === null) return valid.response;

  const { currentId, currentPassword, newId, newPassword, newUserName } = valid.data;

  const hashCurrentId = await sha256Gen(currentId);
  const auth = await db
    .selectFrom('moderator_auth')
    .select(['uuid', 'password'])
    .where('uuid', '=', uuid)
    .where('id', '=', hashCurrentId)
    .executeTakeFirst();

  if (!auth) {
    return NextResponse.json(
      { error: '現在のIDまたはパスワードが正しくありません。' },
      { status: 401 }
    );
  }

  const verified = await argon2Verify(auth.password, currentPassword);
  if (!verified) {
    return NextResponse.json(
      { error: '現在のIDまたはパスワードが正しくありません。' },
      { status: 401 }
    );
  }

  const newHashId = await sha256Gen(newId);
  const duplicatedId = await db
    .selectFrom('moderator_auth')
    .select('uuid')
    .where('id', '=', newHashId)
    .where('uuid', '!=', uuid)
    .executeTakeFirst();

  if (duplicatedId) {
    return NextResponse.json({ error: 'そのIDは使用できません。' }, { status: 409 });
  }

  const newHashPassword = await argon2Gen(newPassword);

  await db
    .updateTable('moderator_auth')
    .set({
      id: newHashId,
      password: newHashPassword,
      user_name: newUserName,
      must_change_credentials: 0,
      login_fail_count: 0,
      locked_until: null,
    })
    .where('uuid', '=', uuid)
    .execute();

  accessLogger(request).info(`Admin Credential Updated uuid=${uuid}`);

  return NextResponse.json({ result: true });
}
