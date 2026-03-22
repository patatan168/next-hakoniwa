/**
 * @module admin-api/users/[uuid]
 * @description admin専用のユーザー詳細取得/削除API。
 */
import { db, Island, isSqlite, User } from '@/db/kysely';
import { logIslandDelete } from '@/global/define/logType';
import { asyncRequestValid } from '@/global/function/api';
import { createUuid25 } from '@/global/function/encrypt';
import { accessLogger } from '@/global/function/logger';
import { abandonIsland } from '@/global/function/turnProgress';
import { adminUserDeleteSchema } from '@/global/valid/server/admin';
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAdminContext } from '../_shared';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const contextResult = resolveAdminContext(request);
  if (contextResult.error) return contextResult.error;

  const { uuid } = await context.params;

  const user = await db
    .selectFrom('user')
    .innerJoin('island', 'island.uuid', 'user.uuid')
    .innerJoin('auth', 'auth.uuid', 'user.uuid')
    .select([
      'user.uuid',
      'user.user_name',
      'user.island_name',
      'island.money',
      'island.food',
      'auth.locked_until',
    ])
    .where('user.uuid', '=', uuid)
    .where('user.inhabited', '=', 1)
    .executeTakeFirst();

  if (!user) {
    return NextResponse.json({ error: '対象ユーザーが見つかりません。' }, { status: 404 });
  }

  const isLocked = user.locked_until !== null && Date.now() < new Date(user.locked_until).getTime();

  return NextResponse.json({
    uuid: user.uuid,
    userName: user.user_name,
    islandName: user.island_name,
    money: user.money,
    food: user.food,
    isLocked,
    lockedUntil: user.locked_until,
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const contextResult = resolveAdminContext(request);
  if (contextResult.error) return contextResult.error;
  const { adminUuid, adminRole } = contextResult.context!;

  const { uuid } = await context.params;

  const valid = await asyncRequestValid(request, adminUserDeleteSchema);
  if (valid.data === null) return valid.response;

  const targetUser = await db
    .selectFrom('user')
    .select(['uuid', 'island_name'])
    .where('uuid', '=', uuid)
    .executeTakeFirst();

  if (!targetUser) {
    return NextResponse.json({ error: '対象ユーザーが見つかりません。' }, { status: 404 });
  }

  if (valid.data.confirmIslandName !== targetUser.island_name) {
    return NextResponse.json({ error: '確認用の島名が一致しません。' }, { status: 400 });
  }

  await db.transaction().execute(async (trx) => {
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
        isSqlite
          ? sql<string>`json(island.island_info)`.as('island_info')
          : sql<string>`island.island_info`.as('island_info'),
        sql<string>`island.prize`.as('prize'),
      ])
      .where('user.uuid', '=', uuid)
      .executeTakeFirst();

    await abandonIsland(trx, uuid);

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
          log: logIslandDelete(island as unknown as Island & Pick<User, 'island_name'>),
        })
        .execute();
    }
  });

  accessLogger(request).info(
    `Admin User Deleted by uuid=${adminUuid} role=${adminRole} target=${uuid}`
  );

  return NextResponse.json({ result: true });
}
