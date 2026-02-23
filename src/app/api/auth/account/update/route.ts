import { authSchemaType } from '@/db/schema/authTable';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Gen, argon2Verify } from '@/global/function/argon2';
import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { changeAccountSchema } from '@/global/valid/server/account';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/** アカウント情報一括更新（ID / ユーザー名 / パスワード） */
export async function PUT(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const uuid = await validAuthCookie(db.client, true);
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
  const auth = db.client
    .prepare<
      [string, string],
      Pick<authSchemaType, 'password'>
    >('SELECT password FROM auth WHERE uuid = ? AND id = ?')
    .get(uuid, hashCurrentId);
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
    const exists = db.client
      .prepare<string, { uuid: string }>('SELECT uuid FROM auth WHERE id = ?')
      .get(newHashId);
    if (exists) {
      return NextResponse.json({ error: 'そのIDは使用できません。' }, { status: 409 });
    }
  }

  if (changeUserName) {
    const exists = db.client
      .prepare<string, { uuid: string }>('SELECT uuid FROM user WHERE user_name = ?')
      .get(newUserName!);
    if (exists) {
      return NextResponse.json({ error: 'そのユーザー名は使用できません。' }, { status: 409 });
    }
  }

  const newHashPass = changePassword ? await argon2Gen(newPassword!) : null;

  // トランザクション内で一括更新
  db.client.transaction(() => {
    if (newHashId) {
      db.client
        .prepare<[string, string], void>('UPDATE auth SET id = ? WHERE uuid = ?')
        .run(newHashId, uuid);
    }
    if (changeUserName) {
      db.client
        .prepare<[string, string], void>('UPDATE user SET user_name = ? WHERE uuid = ?')
        .run(newUserName!, uuid);
    }
    if (newHashPass) {
      db.client
        .prepare<[string, string], void>('UPDATE auth SET password = ? WHERE uuid = ?')
        .run(newHashPass, uuid);
    }
  })();

  accessLogger(request).info(`Update Account uuid=${uuid}`);
  return NextResponse.json({ result: true });
}
