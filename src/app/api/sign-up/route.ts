import { asyncRequestValid } from '@/global/function/api';
import { argon2Gen } from '@/global/function/argon2';
import { createJwtToken } from '@/global/function/auth';
import { createIsland } from '@/global/function/createIsland';
import { dbConn } from '@/global/function/db';
import { createUuid25, sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { userInfoSchema } from '@/global/valid/server/userInfo';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function POST(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');

  const valid = await asyncRequestValid(request, userInfoSchema, 201);

  if (valid.data !== null) {
    const { id, password, userName, islandName } = valid.data;
    const uuid = createUuid25();
    const hashId = await sha256Gen(id);
    const hashPass = await argon2Gen(password);

    const insertUser = db.client.prepare<[string, string, string], void>(
      `INSERT INTO user(uuid, user_name, island_name) values(?, ?, ?)`
    );
    const insertAuth = db.client.prepare<[string, string, string], void>(
      `INSERT INTO auth(uuid, id, password) values(?, ?, ?)`
    );
    const insertLastLogin = db.client.prepare<[string], void>(
      `INSERT INTO last_login(uuid, last_login_at) values(?, unixepoch())`
    );
    db.client.transaction(() => {
      insertUser.run(uuid, userName, islandName);
      insertAuth.run(uuid, hashId, hashPass);
      insertLastLogin.run(uuid);
    })();

    // アクセストークンとリフレッシュトークンを発行
    await createJwtToken(db.client, uuid, false);
    await createJwtToken(db.client, uuid, true);

    accessLogger(request).info(`Sign Up uuid=${uuid}`);

    createIsland(db.client, uuid);
  }
  return valid.response;
}
