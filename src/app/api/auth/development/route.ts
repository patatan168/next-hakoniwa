import { db, Island, isSqlite, parseJsonIslandData, User } from '@/db/kysely';
import { getAchievement } from '@/global/define/achievementType';
import { getIslandNameChangeCooldownSeconds } from '@/global/function/islandNameChangeCooldown';
import { accessLogger } from '@/global/function/logger';
import { grantLoginBonus } from '@/global/function/loginBonus';
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return NextResponse.json(
      { error: '島の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
  const islandDataRaw = await db
    .selectFrom((eb) =>
      eb
        .selectFrom('user')
        .innerJoin('island', 'user.uuid', 'island.uuid')
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
          'user.user_name',
          'user.island_name_prefix',
          'user.island_name',
          'user.island_name_changed_at',
          // SQLite: json() で文字列変換が必要、MySQL: JSON 型はそのまま参照
          isSqlite
            ? sql<string>`json(island.island_info)`.as('island_info')
            : sql<string>`island.island_info`.as('island_info'),
          sql<string>`island.prize`.as('prize'),
          sql<number>`RANK() OVER (ORDER BY island.population DESC)`.as('rank'),
        ])
        .as('ranked')
    )
    .selectAll()
    .where('uuid', '=', uuid)
    .executeTakeFirst();

  const islandData = islandDataRaw as unknown as Island &
    Pick<User, 'island_name' | 'user_name' | 'island_name_prefix' | 'island_name_changed_at'>;
  if (islandData === undefined) {
    accessLogger(request).warn(`Internal Server Error: Development uuid=${uuid}`);
    return NextResponse.json({ error: '島の取得に失敗しました。' }, { status: 500 });
  }

  parseJsonIslandData(islandData, false);

  const loginBonus = await grantLoginBonus(uuid, islandData);

  const ownedTitles = await db
    .selectFrom('prize')
    .select('prize')
    .where('uuid', '=', uuid)
    .orderBy('prize', 'asc')
    .execute();

  const currentTitleType = typeof islandData.prize === 'string' ? islandData.prize : '';
  const currentTitleName = currentTitleType
    ? (getAchievement(currentTitleType)?.name ?? currentTitleType)
    : '';
  const islandNameChangedAt = Number(islandData.island_name_changed_at);
  const nextIslandNameChangeAt = islandNameChangedAt + getIslandNameChangeCooldownSeconds();
  const canChangeIslandName =
    islandNameChangedAt === 0 || Math.floor(Date.now() / 1000) >= nextIslandNameChangeAt;

  return NextResponse.json({
    ...islandData,
    island_name_changed_at: islandNameChangedAt,
    current_title_type: currentTitleType,
    current_title_name: currentTitleName,
    available_titles: ownedTitles.map((t) => ({
      type: t.prize,
      name: getAchievement(t.prize)?.name ?? t.prize,
    })),
    can_change_island_name: canChangeIslandName,
    next_island_name_change_at: nextIslandNameChangeAt,
    loginBonus,
  });
}
