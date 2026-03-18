/**
 * @module turnState
 * @description ターン処理中の状態管理フラグ。
 */
import { db } from '@/db/kysely';
import { NextResponse } from 'next/server';

/**
 * ターン処理中かどうかを判定する
 * @returns ターン処理中であれば true、それ以外は false
 */
export async function isTurnProcessing(): Promise<boolean> {
  const state = await db
    .selectFrom('turn_state')
    .select('turn_processing')
    .limit(1)
    .executeTakeFirst();

  return state?.turn_processing === 1;
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
