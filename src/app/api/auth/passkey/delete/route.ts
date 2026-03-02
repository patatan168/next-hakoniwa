import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { accessLogger } from '@/global/function/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * 指定したPasskeyを削除する（認証必須）
 */
export async function DELETE(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');

  const uuid = await validAuthCookie(db.client, true);
  if (!uuid) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = (await request.json()) as { credential_id: string };
  if (!body.credential_id) {
    return NextResponse.json({ error: 'credential_idが必要です' }, { status: 400 });
  }

  // 自分のPasskeyのみ削除可能
  const result = db.client
    .prepare(`DELETE FROM passkey WHERE credential_id = ? AND uuid = ?`)
    .run(body.credential_id, uuid);

  if (result.changes === 0) {
    return NextResponse.json({ error: '対象のPasskeyが見つかりません' }, { status: 404 });
  }

  accessLogger(request).info(`Passkey deleted uuid=${uuid} credential_id=${body.credential_id}`);
  return NextResponse.json({ result: true });
}
