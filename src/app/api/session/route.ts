import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  // セッションのバリデーション
  using db = dbConn('./src/db/data/main.db');
  const uuid = await validAuthCookie(db.client);
  if (uuid !== undefined) {
    return NextResponse.json({ uuid: uuid });
  } else {
    return NextResponse.json({ error: 'セッションが切断されました。' }, { status: 401 });
  }
}
