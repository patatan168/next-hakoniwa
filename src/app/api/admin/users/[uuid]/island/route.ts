/**
 * @module admin-api/users/[uuid]/island
 * @description admin専用の島名/資源編集API。
 */
import { db } from '@/db/kysely';
import { asyncRequestValid } from '@/global/function/api';
import { accessLogger } from '@/global/function/logger';
import { adminUserIslandUpdateSchema } from '@/global/valid/server/admin';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAdminContext } from '../../_shared';

const nowUnixString = () => String(Math.floor(Date.now() / 1000));

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ uuid: string }> }) {
  const contextResult = resolveAdminContext(request);
  if (contextResult.error) return contextResult.error;
  const { adminUuid, adminRole } = contextResult.context!;

  const { uuid } = await context.params;

  const target = await db
    .selectFrom('user')
    .innerJoin('island', 'island.uuid', 'user.uuid')
    .select(['user.uuid', 'user.island_name'])
    .where('user.uuid', '=', uuid)
    .executeTakeFirst();

  if (!target) {
    return NextResponse.json({ error: '対象ユーザーが見つかりません。' }, { status: 404 });
  }

  const valid = await asyncRequestValid(request, adminUserIslandUpdateSchema);
  if (valid.data === null) return valid.response;

  const { islandName, money, food } = valid.data;

  const duplicatedIsland = await db
    .selectFrom('user')
    .select('uuid')
    .where('island_name', '=', islandName)
    .where('uuid', '!=', uuid)
    .executeTakeFirst();

  if (duplicatedIsland) {
    return NextResponse.json({ error: '同じ島名は登録できません。' }, { status: 409 });
  }

  await db.transaction().execute(async (trx) => {
    await trx
      .updateTable('user')
      .set({
        island_name: islandName,
        island_name_changed_at: nowUnixString(),
      })
      .where('uuid', '=', uuid)
      .execute();

    await trx
      .updateTable('island')
      .set({
        money,
        food,
      })
      .where('uuid', '=', uuid)
      .execute();
  });

  accessLogger(request).info(
    `Admin User Island Updated by uuid=${adminUuid} role=${adminRole} target=${uuid}`
  );

  return NextResponse.json({ result: true });
}
