/**
 * @module sign-up
 * @description サインアップ処理を行うAPIルート。
 */
import { db } from '@/db/kysely';
import META_DATA from '@/global/define/metadata';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Gen } from '@/global/function/argon2';
import { createJwtToken } from '@/global/function/auth';
import { createIsland } from '@/global/function/createIsland';
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
  if (await isTurnProcessing()) {
    return turnProcessingResponse();
  }

  const valid = await asyncRequestValid(request, userInfoSchema, 201);

  if (valid.data !== null) {
    const { id, password, userName, islandName } = valid.data;
    // 卑猥語/差別用語チェック
    if (profanityCheck(userName) || profanityCheck(islandName)) {
      return NextResponse.json({ error: '不適切な単語が含まれています' }, { status: 400 });
    }
    const uuid = createUuid25();
    const hashId = await sha256Gen(id);
    const hashPass = await argon2Gen(password);

    // 本番環境のみフィンガープリントによる多重登録チェック
    const clientFpHash = request.headers.get('x-fp-hash') ?? '';
    const fpHash = clientFpHash ? hashFingerprintWithPepper(clientFpHash, META_DATA.FP_PEPPER) : '';
    if (process.env.NODE_ENV === 'production' && fpHash) {
      const row = await db
        .selectFrom('auth')
        .select(db.fn.countAll<number>().as('cnt'))
        .where('fp_hash', '=', fpHash)
        .executeTakeFirst();
      if ((row?.cnt ?? 0) > 0) {
        return NextResponse.json(
          { error: 'このデバイスからの新規登録はできません' },
          { status: 409 }
        );
      }
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('user')
        .values({
          uuid,
          user_name: userName,
          island_name: islandName,
        })
        .execute();

      await trx
        .insertInto('auth')
        .values({
          uuid,
          id: hashId,
          password: hashPass,
          fp_hash: fpHash,
        })
        .execute();

      await trx
        .insertInto('last_login')
        .values({
          uuid,
        })
        .execute();
    });

    // アクセストークンとリフレッシュトークンを発行
    await createJwtToken(db, uuid, false);
    await createJwtToken(db, uuid, true);

    accessLogger(request).info(`Sign Up uuid=${uuid}`);

    await createIsland(db, uuid);

    return NextResponse.json({ result: true, uuid }, { status: 201 });
  }
  return valid.response;
}
