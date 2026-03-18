/**
 * @module auth/missile-stats
 * @description ミサイル統計情報を返すAPIルート。
 */
import { db } from '@/db/kysely';
import { getMapDefine } from '@/global/define/mapType';
import { NextResponse } from 'next/server';

type BreakdownItem = {
  type: string;
  name: string;
  count: number;
};

const toMapName = (type: string) => {
  const { name } = getMapDefine(type);
  return typeof name === 'string' ? name : (name[0] ?? type);
};

const toBreakdownItems = (
  rows: Array<{ type: string; count: number }>,
  resolveName: (type: string) => string
): BreakdownItem[] =>
  rows.map(({ type, count }) => ({
    type,
    name: resolveName(type),
    count,
  }));

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: Request) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }

  const row = await db
    .selectFrom('missile_stats')
    .select(['monster_kill', 'city_kill'])
    .where('uuid', '=', uuid)
    .executeTakeFirst();

  const destroyedMapRows = await db
    .selectFrom('missile_destroy_map_stats')
    .select(['map_type as type', 'count'])
    .where('uuid', '=', uuid)
    .orderBy('count', 'desc')
    .execute();

  const killedMonsterRows = await db
    .selectFrom('missile_kill_monster_stats')
    .select(['monster_type as type', 'count'])
    .where('uuid', '=', uuid)
    .orderBy('count', 'desc')
    .execute();

  return NextResponse.json({
    monster_kill: row?.monster_kill ?? 0,
    city_kill: row?.city_kill ?? 0,
    destroyed_maps: toBreakdownItems(destroyedMapRows, toMapName),
    killed_monsters: toBreakdownItems(killedMonsterRows, toMapName),
  });
}
