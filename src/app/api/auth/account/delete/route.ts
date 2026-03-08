import { db } from '@/db/kysely';
import { islandSchemaType } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { logIslandDelete } from '@/global/define/logType';
import { asyncRequestValid } from '@/global/function/api';
import { argon2Verify } from '@/global/function/argon2';
import { signOutDeleteJwtDbCookie, validAuthCookie } from '@/global/function/auth';
import { createUuid25, sha256Gen } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { abandonIsland } from '@/global/function/turnProgress';
import { isTurnProcessing, turnProcessingResponse } from '@/global/function/turnState';
import { deleteAccountSchema } from '@/global/valid/server/account';
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

/** アカウント削除（島の放棄） */
export async function DELETE(request: NextRequest) {
  if (await isTurnProcessing()) {
    return turnProcessingResponse();
  }

  const uuid = await validAuthCookie(db, true);
  if (!uuid) {
    return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
  }

  const valid = await asyncRequestValid(request, deleteAccountSchema);
  if (valid.data === null) return valid.response;

  const { currentId, currentPassword } = valid.data;

  // 現在のID・パスワード検証
  const hashCurrentId = await sha256Gen(currentId);
  const auth = await db
    .selectFrom('auth')
    .select('password')
    .where('uuid', '=', uuid)
    .where('id', '=', hashCurrentId)
    .executeTakeFirst();
  if (!auth) {
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません。' }, { status: 401 });
  }

  const verified = await argon2Verify(auth.password, currentPassword);
  if (!verified) {
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません。' }, { status: 401 });
  }

  // 島の放棄処理（共通関数）
  await db.transaction().execute(async (trx) => {
    // 削除前に島情報を取得（ログ用）
    const island = await trx
      .selectFrom('island')
      .innerJoin('user', 'user.uuid', 'island.uuid')
      .select([
        'island.uuid',
        'island.money',
        'island.area',
        'island.population',
        'island.food',
        'island.farm',
        'island.factory',
        'island.mining',
        'island.missile',
        'user.island_name',
        sql<string>`json(island.island_info)`.as('island_info'),
        sql<string>`json(island.prize)`.as('prize'),
      ])
      .where('user.uuid', '=', uuid)
      .executeTakeFirst();

    // 島の放棄
    await abandonIsland(trx, uuid);

    // 放棄ログの挿入
    if (island) {
      const turnState = await trx.selectFrom('turn_state').select('turn').executeTakeFirst();
      await trx
        .insertInto('turn_log')
        .values({
          log_uuid: createUuid25(),
          from_uuid: uuid,
          to_uuid: null,
          turn: turnState?.turn ?? 0,
          secret_log: '',
          log: logIslandDelete(
            island as unknown as islandSchemaType & Pick<userSchemaType, 'island_name'>
          ),
        })
        .execute();
    }
  });

  // サインアウト処理（Cookie/DB削除）
  await signOutDeleteJwtDbCookie(db);

  accessLogger(request).info(`Delete Account uuid=${uuid}`);
  return NextResponse.json({ result: true });
}
