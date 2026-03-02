import { createJwtToken } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { accessLogger } from '@/global/function/logger';
import { getPasskeyByCredentialId, verifyPasskeyAuthentication } from '@/global/function/passkey';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * Passkey認証完了 — assertionを検証してJWT Cookieを発行する
 * @note 認証前に呼ばれるため /api/auth/ の外に配置
 */
export async function POST(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');

  const body = (await request.json()) as AuthenticationResponseJSON;

  const passkey = getPasskeyByCredentialId(db.client, body.id);
  if (!passkey) {
    return NextResponse.json({ error: 'Passkeyが見つかりません' }, { status: 401 });
  }

  const newCounter = await verifyPasskeyAuthentication(body, passkey);
  if (newCounter === undefined) {
    return NextResponse.json({ error: 'Passkey認証に失敗しました' }, { status: 401 });
  }

  // カウンタ更新（リプレイアタック防止）
  db.client
    .prepare(`UPDATE passkey SET counter = ? WHERE credential_id = ?`)
    .run(newCounter, passkey.credential_id);

  // 既存の認証システムと同様にJWT Cookieを発行
  await createJwtToken(db.client, passkey.uuid, false);
  await createJwtToken(db.client, passkey.uuid, true);

  accessLogger(request).info(`Passkey sign in uuid=${passkey.uuid}`);
  return NextResponse.json({ result: true });
}
