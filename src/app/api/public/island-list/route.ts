import { db } from '@/db/kysely';
import { getAchievement } from '@/global/define/achievementType';
import { sql } from 'kysely';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET() {
  const user = await db
    .selectFrom((eb) =>
      eb
        .selectFrom('user')
        .innerJoin('island', 'user.uuid', 'island.uuid')
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

  return NextResponse.json(rounded);
}
