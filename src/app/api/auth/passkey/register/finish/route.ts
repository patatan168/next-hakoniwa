import { db } from '@/db/kysely';
import { validAuthCookie } from '@/global/function/auth';
import { accessLogger } from '@/global/function/logger';
import {
  hashFingerprint,
  isFpDuplicate,
  verifyPasskeyRegistration,
} from '@/global/function/passkey';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * Passkey登録完了 — attestationを検証してDBに保存する
 */
export async function POST(request: NextRequest) {
  const uuid = await validAuthCookie(db, true);
  if (!uuid) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = (await request.json()) as {
    response: RegistrationResponseJSON;
    deviceName?: string;
    /** クライアント側SHA-256ハッシュ済みのフィンガープリント文字列 */
    fpHash?: string;
  };
  const deviceName = body.deviceName ?? 'デバイス';

  const passkey = await verifyPasskeyRegistration(body.response, deviceName);
  if (!passkey) {
    return NextResponse.json({ error: 'Passkeyの検証に失敗しました' }, { status: 400 });
  }

  // 本番環境のみフィンガープリントによる重複チェックを行う
  const fpHash = body.fpHash ? hashFingerprint(body.fpHash) : '';
  if (process.env.NODE_ENV === 'production' && (await isFpDuplicate(db, fpHash, uuid))) {
    return NextResponse.json(
      { error: 'このデバイスは別のアカウントでPasskeyに登録されています' },
      { status: 409 }
    );
  }

  await db
    .insertInto('passkey')
    .values({
      credential_id: passkey.credential_id,
      uuid,
      public_key: passkey.public_key,
      device_name: passkey.device_name,
      counter: passkey.counter,
      fp_hash: fpHash,
    })
    .execute();

  accessLogger(request).info(`Passkey registered uuid=${uuid} device="${passkey.device_name}"`);
  return NextResponse.json({ result: true });
}
