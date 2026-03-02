import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { getPasskeysByUuid } from '@/global/function/passkey';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * 登録済みPasskeyの一覧を返す（認証必須）
 */
export async function GET() {
  using db = dbConn('./src/db/data/main.db');

  const uuid = await validAuthCookie(db.client, true);
  if (!uuid) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const passkeys = getPasskeysByUuid(db.client, uuid);
  return NextResponse.json({ passkeys });
}
