import { db } from '@/db/kysely';
import META_DATA from '@/global/define/metadata';
import { validAuthCookie } from '@/global/function/auth';
import { createRegistrationOptions, getPasskeysByUuid } from '@/global/function/passkey';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * Passkey登録開始 — 登録オプション(challenge等)を生成して返す
 */
export async function POST() {
  const uuid = await validAuthCookie(db, true);
  if (!uuid) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const user = await db
    .selectFrom('user')
    .select('user_name')
    .where('uuid', '=', uuid)
    .executeTakeFirst();
  if (!user) return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });

  const existingKeys = await getPasskeysByUuid(db, uuid);
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
