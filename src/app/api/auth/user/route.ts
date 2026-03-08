import { db } from '@/db/kysely';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  const user = await getAlluser();
  return NextResponse.json(user);
}

/**
 * ユーザー情報取得
 * @returns 全ユーザー情報
 */
async function getAlluser() {
  const user = await db.selectFrom('user').selectAll().execute();
  return user;
}
