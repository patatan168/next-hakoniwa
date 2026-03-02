import META_DATA from '@/global/define/metadata';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Gen } from '@/global/function/argon2';
import { createJwtToken } from '@/global/function/auth';
import { createIsland } from '@/global/function/createIsland';
import { dbConn } from '@/global/function/db';
import { createUuid25, hashFingerprintWithPepper, sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { profanityCheck } from '@/global/function/profanity';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { userInfoSchema } from '@/global/valid/server/userInfo';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function POST(request: NextRequest) {
  if (isTurnProcessing()) {
    return turnProcessingResponse();
  }

  const valid = await asyncRequestValid(request, userInfoSchema, 201);

  if (valid.data !== null) {
    const { id, password, userName, islandName } = valid.data;
    // 卑猥語/差別用語チェック
    if (profanityCheck(userName) || profanityCheck(islandName)) {
      return NextResponse.json({ error: '不適切な単語が含まれています' }, { status: 400 });
    }
    using db = dbConn('./src/db/data/main.db');
    const uuid = createUuid25();
    const hashId = await sha256Gen(id);
    const hashPass = await argon2Gen(password);

    // 本番環境のみフィンガープリントによる多重登録チェック
    const clientFpHash = request.headers.get('x-fp-hash') ?? '';
    const fpHash = clientFpHash ? hashFingerprintWithPepper(clientFpHash, META_DATA.FP_PEPPER) : '';
    if (process.env.NODE_ENV === 'production' && fpHash) {
      const row = db.client
        .prepare<string, { cnt: number }>(`SELECT COUNT(*) AS cnt FROM auth WHERE fp_hash = ?`)
        .get(fpHash);
      if ((row?.cnt ?? 0) > 0) {
        return NextResponse.json(
          { error: 'このデバイスからの新規登録はできません' },
          { status: 409 }
        );
      }
    }

    const insertUser = db.client.prepare<[string, string, string], void>(
      `INSERT INTO user(uuid, user_name, island_name) values(?, ?, ?)`
    );
    const insertAuth = db.client.prepare<[string, string, string, string], void>(
      `INSERT INTO auth(uuid, id, password, fp_hash) values(?, ?, ?, ?)`
    );
    const insertLastLogin = db.client.prepare<[string], void>(
      `INSERT INTO last_login(uuid, last_login_at) values(?, unixepoch())`
    );
    db.client.transaction(() => {
      insertUser.run(uuid, userName, islandName);
      insertAuth.run(uuid, hashId, hashPass, fpHash);
      insertLastLogin.run(uuid);
    })();

    // アクセストークンとリフレッシュトークンを発行
    await createJwtToken(db.client, uuid, false);
    await createJwtToken(db.client, uuid, true);

    accessLogger(request).info(`Sign Up uuid=${uuid}`);

    createIsland(db.client, uuid);

    return NextResponse.json({ result: true, uuid }, { status: 201 });
  }
  return valid.response;
}
