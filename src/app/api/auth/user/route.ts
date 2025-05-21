import { asyncRequestValid } from '@/global/function/api';
import { createJwtToken, setAuthCookie, sha256Gen } from '@/global/function/auth';
import { createIsland } from '@/global/function/createIsland';
import { dbConn } from '@/global/function/db';
import { accessLogger } from '@/global/function/logger';
import { userInfoSchema } from '@/global/valid/userInfo';
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

  const valid = await asyncRequestValid(request, userInfoSchema);

  if (valid.data !== null) {
    const { id, password, islandName } = valid.data;
    const uuid = crypto.randomUUID();
    const hashId = await sha256Gen(id);
    const hashPass = await sha256Gen(password);

    const postUser = db.client.prepare(
      `INSERT INTO user(uuid, id, password, island_name) values(?, ?, ?, ?)`
    );

    postUser.run(uuid, hashId, hashPass, islandName);
    const response = new NextResponse('Success');

    await setAuthCookie(createJwtToken(db.client, uuid), response, request);

    accessLogger(request).info(`Create uuid=${uuid}`);

    createIsland(db.client, uuid, islandName);
  }
  return valid.response;
}

export async function DELETE(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const { id, password } = await request.json();
  const hashId = await sha256Gen(id);
  const hashPass = await sha256Gen(password);

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
