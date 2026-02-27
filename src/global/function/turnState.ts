import { turnStateSchemaType } from '@/db/schema/turnStateTable';
import { NextResponse } from 'next/server';
import { dbConn } from './db';

/**
 * ターン処理中かどうかを判定する
 * @returns ターン処理中であれば true、それ以外は false
 */
export function isTurnProcessing(): boolean {
  using db = dbConn('./src/db/data/main.db');
  const user = db.client.prepare('SELECT turn_processing FROM turn_state Limit 1').get() as Pick<
    turnStateSchemaType,
    'turn_processing'
  >;

  return user?.turn_processing === 1;
}

/**
 * ターン処理中の共通エラーレスポンスを返す
 * @returns HTTP 503エラーを含むNextResponse
 */
export function turnProcessingResponse() {
  return NextResponse.json(
    { error: '現在ターン処理中のため、この操作を実行できません。' },
    { status: 503 }
  );
}
