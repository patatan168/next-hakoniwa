import { userSchemaType } from '@/db/schema/userTable';
import META_DATA from '@/global/define/metadata';
import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { createRegistrationOptions, getPasskeysByUuid } from '@/global/function/passkey';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * Passkey登録開始 — 登録オプション(challenge等)を生成して返す
 */
export async function POST() {
  using db = dbConn('./src/db/data/main.db');

  const uuid = await validAuthCookie(db.client, true);
  if (!uuid) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const user = db.client
    .prepare<string, Pick<userSchemaType, 'user_name'>>(`SELECT user_name FROM user WHERE uuid = ?`)
    .get(uuid);
  if (!user) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });

  const existingKeys = getPasskeysByUuid(db.client, uuid);
  if (existingKeys.length >= META_DATA.MAX_PASSKEYS) {
    return NextResponse.json(
      { error: `Passkeyの登録数が上限（${META_DATA.MAX_PASSKEYS}件）に達しています` },
      { status: 400 }
    );
  }

  const existingIds = existingKeys.map((k) => k.credential_id);
  const options = await createRegistrationOptions(uuid, user.user_name, existingIds);
  return NextResponse.json(options);
}
