import { db } from '@/db/kysely';
import { createJwtToken } from '@/global/function/auth';
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
  const body = (await request.json()) as AuthenticationResponseJSON;

  const passkey = await getPasskeyByCredentialId(db, body.id);
  if (!passkey) {
    return NextResponse.json({ error: 'Passkeyが見つかりません' }, { status: 401 });
  }

  const newCounter = await verifyPasskeyAuthentication(body, passkey);
  if (newCounter === undefined) {
    return NextResponse.json({ error: 'Passkey認証に失敗しました' }, { status: 401 });
  }

  // カウンタ更新（リプレイアタック防止）
  await db
    .updateTable('passkey')
    .set({ counter: newCounter })
    .where('credential_id', '=', passkey.credential_id)
    .execute();

  // 既存の認証システムと同様にJWT Cookieを発行
  await createJwtToken(db, passkey.uuid, false);
  await createJwtToken(db, passkey.uuid, true);

  accessLogger(request).info(`Passkey sign in uuid=${passkey.uuid}`);
  return NextResponse.json({ result: true });
}
