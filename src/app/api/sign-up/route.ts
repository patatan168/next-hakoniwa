/**
 * @module sign-up
 * @description サインアップ処理を行うAPIルート。
 */
import { db, isSqlite } from '@/db/kysely';
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
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

const SIGN_UP_LIMIT_MESSAGE = '現在は新規登録できません。登録ユーザー数が上限に達しています';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  if (await isTurnProcessing()) {
    return NextResponse.json({
      canSignUp: false,
      message: '現在ターン処理中のため、新規登録を受け付けていません。時間をおいてお試しください',
    });
  }

  const activeUserCount = await db
    .selectFrom('user')
    .select(db.fn.countAll<number>().as('cnt'))
    .where('inhabited', '=', 1)
    .executeTakeFirst();

  if ((activeUserCount?.cnt ?? 0) >= META_DATA.MAX_REGISTERED_USERS) {
    return NextResponse.json({ canSignUp: false, message: SIGN_UP_LIMIT_MESSAGE });
  }

  return NextResponse.json({ canSignUp: true });
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

    const uuid = await db.transaction().execute(async (trx) => {
      // サインアップ可否判定を直列化して、同時登録での上限超過を防ぐ
      if (isSqlite) {
        const lockRows = await sql<{
          lock_id: number;
        }>`SELECT lock_id FROM sign_up_lock WHERE lock_id = 1`.execute(trx);
        if (lockRows.rows.length === 0) {
          throw new Error('sign_up_lock row is not initialized');
        }

        await sql`UPDATE sign_up_lock SET lock_id = lock_id WHERE lock_id = 1`.execute(trx);
      } else {
        const lockRows = await sql<{
          lock_id: number;
        }>`SELECT lock_id FROM sign_up_lock WHERE lock_id = 1 FOR UPDATE`.execute(trx);
        if (lockRows.rows.length === 0) {
          throw new Error('sign_up_lock row is not initialized');
        }
      }

      const activeUserCount = await trx
        .selectFrom('user')
        .select(trx.fn.countAll<number>().as('cnt'))
        .where('inhabited', '=', 1)
        .executeTakeFirst();

      if ((activeUserCount?.cnt ?? 0) >= META_DATA.MAX_REGISTERED_USERS) {
        return null;
      }

      const createdUuid = createUuid25();
      const hashId = await sha256Gen(id);
      const hashPass = await argon2Gen(password);

      await trx
        .insertInto('user')
        .values({
          uuid: createdUuid,
          user_name: userName,
          island_name: islandName,
        })
        .execute();

      await trx
        .insertInto('auth')
        .values({
          uuid: createdUuid,
          id: hashId,
          password: hashPass,
          fp_hash: fpHash,
        })
        .execute();

      await trx
        .insertInto('last_login')
        .values({
          uuid: createdUuid,
        })
        .execute();

      return createdUuid;
    });

    if (uuid === null) {
      return NextResponse.json({ error: SIGN_UP_LIMIT_MESSAGE }, { status: 409 });
    }

    // アクセストークンとリフレッシュトークンを発行
    await createJwtToken(db, uuid, false);
    await createJwtToken(db, uuid, true);

    accessLogger(request).info(`Sign Up uuid=${uuid}`);

    await createIsland(db, uuid);

    return NextResponse.json({ result: true, uuid }, { status: 201 });
  }
  return valid.response;
}
