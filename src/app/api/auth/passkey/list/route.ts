/**
 * @module auth/passkey/list
 * @description 登録済みPasskey一覧を返すAPIルート。
 */
import { db } from '@/db/kysely';
import { validAuthCookie } from '@/global/function/auth';
import { getPasskeysByUuid } from '@/global/function/passkey';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * 登録済みPasskeyの一覧を返す（認証必須）
 */
export async function GET() {
  const uuid = await validAuthCookie(db, true);
  if (!uuid) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const passkeys = await getPasskeysByUuid(db, uuid);
  return NextResponse.json({ passkeys });
}
