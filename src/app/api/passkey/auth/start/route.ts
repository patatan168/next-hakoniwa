import { dbConn } from '@/global/function/db';
import { createAuthenticationOptions } from '@/global/function/passkey';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * Passkey認証開始 — 認証オプション(challenge等)を生成して返す
 * @note 認証前に呼ばれるため /api/auth/ の外に配置
 */
export async function POST() {
  using _db = dbConn('./src/db/data/main.db');
  const options = await createAuthenticationOptions();
  return NextResponse.json(options);
}
