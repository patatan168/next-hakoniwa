/**
 * @module admin-api/sign-out
 * @description 管理者ログアウトAPI。
 */
import { db } from '@/db/kysely';
import { deleteModeratorSession } from '@/global/function/moderatorAuth';
import { NextResponse } from 'next/server';

export async function DELETE() {
  await deleteModeratorSession(db);
  return NextResponse.json({ result: true });
}
