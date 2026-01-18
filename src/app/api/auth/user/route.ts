import { dbConn } from '@/global/function/db';
import sqlite from 'better-sqlite3';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  using db = dbConn('./src/db/data/main.db');
  const user = getAlluser(db);
  return NextResponse.json(user);
}

/**
 * ユーザー情報取得
 * @returns 全ユーザー情報
 */
function getAlluser(db: { client: sqlite.Database; [Symbol.dispose]: () => void }) {
  const user = db.client.prepare('SELECT * FROM user').all();
  return user;
}
