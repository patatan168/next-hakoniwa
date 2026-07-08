/**
 * @module public/island-list
 * @description 島一覧を返す公開APIルート。
 */
import { db } from '@/db/kysely';
import { getAchievement } from '@/global/define/achievementType';
import { sql } from 'kysely';
import { NextResponse } from 'next/server';

export const revalidate = 30;

const CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
};

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  const user = await db
    .selectFrom((eb) =>
      eb
        .selectFrom('user')
        .innerJoin('island', 'user.uuid', 'island.uuid')
        .innerJoin('last_login', 'user.uuid', 'last_login.uuid')
        .select([
          'user.uuid',
          'user.user_name',
          'user.island_name_prefix',
          'user.island_name',
          'island.prize',
          'island.population',
          'island.money',
          'island.food',
          'island.area',
          'island.farm',
          'island.factory',
          'island.mining',
          'last_login.last_login_at',
          sql<number>`RANK() OVER (ORDER BY island.population DESC)`.as('rank'),
        ])
        .where('user.inhabited', '=', 1)
        .as('ranked')
    )
    .selectAll()
    .orderBy('rank', 'asc')
    .execute();

  const rounded = user.map((row) => ({
    ...row,
    current_title_name: row.prize ? (getAchievement(row.prize)?.name ?? row.prize) : '',
    money: Math.round(row.money / 1000) * 1000,
  }));

  return NextResponse.json(rounded, { headers: CACHE_HEADER });
}
