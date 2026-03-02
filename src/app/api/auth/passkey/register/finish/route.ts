import { validAuthCookie } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
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
  using db = dbConn('./src/db/data/main.db');

  const uuid = await validAuthCookie(db.client, true);
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
  if (process.env.NODE_ENV === 'production' && isFpDuplicate(db.client, fpHash, uuid)) {
    return NextResponse.json(
      { error: 'このデバイスは別のアカウントでPasskeyに登録されています' },
      { status: 409 }
    );
  }

  db.client
    .prepare(
      `INSERT INTO passkey (credential_id, uuid, public_key, device_name, counter, fp_hash) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      passkey.credential_id,
      uuid,
      passkey.public_key,
      passkey.device_name,
      passkey.counter,
      fpHash
    );

  accessLogger(request).info(`Passkey registered uuid=${uuid} device="${passkey.device_name}"`);
  return NextResponse.json({ result: true });
}
