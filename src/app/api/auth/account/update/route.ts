import { db } from '@/db/kysely';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Gen, argon2Verify } from '@/global/function/argon2';
import { validAuthCookie } from '@/global/function/auth';
import { sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { changeAccountSchema } from '@/global/valid/server/account';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/** アカウント情報一括更新（ID / ユーザー名 / パスワード） */
export async function PUT(request: NextRequest) {
  if (await isTurnProcessing()) {
    return turnProcessingResponse();
  }

  const uuid = await validAuthCookie(db, true);
  if (!uuid) {
    return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
  }

  const valid = await asyncRequestValid(request, changeAccountSchema);
  if (valid.data === null) return valid.response;

  const {
    currentId,
    currentPassword,
    changeId,
    newId,
    changeUserName,
    newUserName,
    changePassword,
    newPassword,
  } = valid.data;

  // 現在のID・パスワード検証
  const hashCurrentId = await sha256Gen(currentId);
  const auth = await db
    .selectFrom('auth')
    .select('password')
    .where('uuid', '=', uuid)
    .where('id', '=', hashCurrentId)
    .executeTakeFirst();
  if (!auth) {
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません。' }, { status: 401 });
  }

  const verified = await argon2Verify(auth.password, currentPassword);
  if (!verified) {
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません。' }, { status: 401 });
  }

  // 事前チェックと非同期処理（トランザクション外で実施）
  let newHashId: string | null = null;
  if (changeId) {
    newHashId = await sha256Gen(newId!);
    const exists = await db
      .selectFrom('auth')
      .select('uuid')
      .where('id', '=', newHashId)
      .executeTakeFirst();
    if (exists) {
      return NextResponse.json({ error: 'そのIDは使用できません。' }, { status: 409 });
    }
  }

  if (changeUserName) {
    const exists = await db
      .selectFrom('user')
      .select('uuid')
      .where('user_name', '=', newUserName!)
      .executeTakeFirst();
    if (exists) {
      return NextResponse.json({ error: 'そのユーザー名は使用できません。' }, { status: 409 });
    }
  }

  const newHashPass = changePassword ? await argon2Gen(newPassword!) : null;

  // トランザクション内で一括更新
  await db.transaction().execute(async (trx) => {
    if (newHashId) {
      await trx.updateTable('auth').set({ id: newHashId }).where('uuid', '=', uuid).execute();
    }
    if (changeUserName) {
      await trx
        .updateTable('user')
        .set({ user_name: newUserName! })
        .where('uuid', '=', uuid)
        .execute();
    }
    if (newHashPass) {
      await trx
        .updateTable('auth')
        .set({ password: newHashPass })
        .where('uuid', '=', uuid)
        .execute();
    }
  });

  accessLogger(request).info(`Update Account uuid=${uuid}`);
  return NextResponse.json({ result: true });
}
