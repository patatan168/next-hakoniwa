import { asyncRequestValid } from '@/global/function/api';
import { createJwtToken, setAuthCookie } from '@/global/function/auth';
import { createIsland } from '@/global/function/createIsland';
import { dbConn } from '@/global/function/db';
import { argon2Gen, createUuid25, sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { userInfoSchema } from '@/global/valid/server/userInfo';
import sqlite from 'better-sqlite3';
import { NextRequest, NextResponse } from 'next/server';

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

  const valid = await asyncRequestValid(request, userInfoSchema, 201);

  if (valid.data !== null) {
    const { id, password, islandName } = valid.data;
    const uuid = createUuid25();
    const hashId = await sha256Gen(id);
    const hashPass = await argon2Gen(password);

    const postUser = db.client.prepare(
      `INSERT INTO user(uuid, id, password, island_name) values(?, ?, ?, ?)`
    );

    postUser.run(uuid, hashId, hashPass, islandName);

    await setAuthCookie(createJwtToken(db.client, uuid), valid.response, request);

    accessLogger(request).info(`Create uuid=${uuid}`);

    createIsland(db.client, uuid);
  }
  return valid.response;
}

export async function DELETE(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const { id, password } = await request.json();
  const hashId = await sha256Gen(id);
  const hashPass = await argon2Gen(password);

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
