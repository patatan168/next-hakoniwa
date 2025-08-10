import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { extractClientIp } from '@/global/function/ip';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  // 不正の疑いがあるIPアドレスはセッションを切る
  const ip = extractClientIp(request);
  if (!ip) return NextResponse.json({ error: 'IPアドレスが逆引きできません。' }, { status: 400 });
  // セッションのバリデーション
  using db = dbConn('./src/db/data/main.db');
  const response = new NextResponse();
  const uuid = await validAuthCookie(db.client, response, request);
  if (uuid !== undefined) {
    return NextResponse.json({ uuid: uuid });
  } else {
    return NextResponse.json({ error: 'セッションが切断されました。' }, { status: 401 });
  }
}
