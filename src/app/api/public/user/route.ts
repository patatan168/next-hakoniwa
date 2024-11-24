import { sha256 } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import sqlite from 'better-sqlite3';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  using db = dbConn('./src/db/data/main.db');
  const user = getAlluser(db);
  return NextResponse.json(user);
}

export async function POST(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const { id, password, islandName } = await request.json();
  const uuid = crypto.randomUUID();
  const hashId = await sha256(id);
  const hashPass = await sha256(password);

  const postUser = db.client.prepare(
    `INSERT INTO user(uuid, id, password, islandName) values(?, ?, ?, ?)`
  );

  postUser.run(uuid, hashId, hashPass, islandName);

  const user = await getAlluser(db);
  return NextResponse.json(user);
}

export async function DELETE(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const { id, password } = await request.json();
  const hashId = await sha256(id);
  const hashPass = await sha256(password);

  const deleteUser = db.client.prepare(`DELETE FROM user WHERE id=? AND password=?`);
  deleteUser.run(hashId, hashPass);

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
